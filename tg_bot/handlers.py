import logging
from datetime import datetime
from typing import Dict, Any

from aiogram import Router, F
from aiogram.types import Message, CallbackQuery, ReplyKeyboardRemove
from aiogram.filters import CommandStart, Command
from aiogram.fsm.context import FSMContext

from states import ReportStates
from keyboards import (
    get_main_menu_keyboard,
    get_report_types_keyboard,
    get_regions_keyboard,
    get_cities_keyboard,
    get_confirmation_keyboard,
    get_language_keyboard,
    get_skip_location_keyboard,
    get_skip_location_inline_keyboard,
    get_skip_address_keyboard,
    get_skip_address_inline_keyboard,
)
from utils import (
    format_report,
    get_address_from_coordinates,
    save_report_to_file,
    validate_report_data,
    escape_markdown,
    get_city_coordinates,
)
from config import ADMIN_USER_ID, API_ENABLED, REGIONS_CITIES
from api_client import send_report_to_api, check_backend_health
from localization import (
    get_text,
    get_user_language,
    get_region_name,
    get_report_type_name,
)

router = Router()


@router.message(CommandStart())
async def start_command(message: Message, state: FSMContext):
    """Handle /start command"""
    await state.clear()

    # Get user's language preference (default to Russian)
    data = await state.get_data()
    lang = get_user_language(data)

    welcome_text = get_text("welcome", lang)

    await message.answer(welcome_text, reply_markup=get_main_menu_keyboard(lang))


@router.message(Command("help"))
async def help_command(message: Message, state: FSMContext):
    """Handle /help command"""
    data = await state.get_data()
    lang = get_user_language(data)

    help_text = f"""
{get_text('help_title', lang)}

{get_text('help_commands', lang)}

{get_text('help_process', lang)}

{get_text('help_support', lang)}
"""

    await message.answer(help_text, parse_mode="Markdown")


@router.message(Command("language"))
async def language_command(message: Message, state: FSMContext):
    """Handle /language command"""
    data = await state.get_data()
    lang = get_user_language(data)

    await message.answer(
        get_text("select_language", lang),
        reply_markup=get_language_keyboard(),
        parse_mode="Markdown",
    )


@router.callback_query(F.data.startswith("set_language:"))
async def set_language(callback: CallbackQuery, state: FSMContext):
    """Handle language selection"""
    await callback.answer()

    lang = callback.data.split(":", 1)[1]
    await state.update_data(language=lang)

    await callback.message.edit_text(
        get_text("language_changed", lang), parse_mode="Markdown"
    )

    await callback.message.answer(
        get_text("choose_action", lang), reply_markup=get_main_menu_keyboard(lang)
    )


@router.message(Command("cancel"))
async def cancel_command(message: Message, state: FSMContext):
    """Handle /cancel command"""
    data = await state.get_data()
    lang = get_user_language(data)

    await state.update_data(language=lang)  # Preserve language setting
    await state.set_state(None)  # Clear state but keep data

    await message.answer(
        get_text("action_cancelled", lang), reply_markup=ReplyKeyboardRemove()
    )
    await message.answer(
        get_text("choose_action", lang), reply_markup=get_main_menu_keyboard(lang)
    )


@router.callback_query(F.data == "create_report")
async def start_report_creation(callback: CallbackQuery, state: FSMContext):
    """Start report creation process"""
    await callback.answer()

    data = await state.get_data()
    lang = get_user_language(data)

    # Initialize report data
    await state.update_data(
        user_id=callback.from_user.id,
        username=callback.from_user.username or "Не указан",
        created_at=datetime.now().strftime("%d.%m.%Y %H:%M"),
        language=lang,
    )

    await callback.message.edit_text(
        get_text("creating_report", lang),
        reply_markup=get_report_types_keyboard(lang),
        parse_mode="Markdown",
    )

    await state.set_state(ReportStates.waiting_for_report_type)


@router.callback_query(F.data.startswith("report_type:"))
async def process_report_type(callback: CallbackQuery, state: FSMContext):
    """Process report type selection"""
    await callback.answer()

    data = await state.get_data()
    lang = get_user_language(data)

    report_type = callback.data.split(":", 1)[1]
    await state.update_data(type=report_type)

    localized_type = get_report_type_name(report_type, lang)

    # Удаляем предыдущее сообщение
    await callback.message.delete()

    # Отправляем новое сообщение с инструкцией по отправке геолокации и кнопкой пропуска
    await callback.message.answer(
        get_text(
            "select_location_on_map", lang
        ),  # Текст с инструкцией и вариантом ручного выбора
        reply_markup=get_skip_location_inline_keyboard(
            lang
        ),  # Inline-клавиатура только с "Пропустить"
        parse_mode="Markdown",
    )

    await state.set_state(ReportStates.waiting_for_location)


@router.callback_query(
    F.data == "skip_location_selection", ReportStates.waiting_for_location
)
async def skip_location_inline(callback: CallbackQuery, state: FSMContext):
    """Handle location skip from inline keyboard"""
    await callback.answer()

    data = await state.get_data()
    lang = get_user_language(data)

    # Удаляем сообщение с кнопкой пропуска
    await callback.message.delete()

    await callback.message.answer(
        get_text(
            "location_skipped", lang
        ),  # Можно использовать тот же текст или другой
        reply_markup=ReplyKeyboardRemove(),  # Убираем Reply клавиатуру, если она была
    )

    # Показываем выбор региона
    region = data.get(
        "region"
    )  # Здесь region еще None, нужно использовать тип обращения
    localized_type = get_report_type_name(data.get("type"), lang)

    await callback.message.answer(
        get_text("select_region", lang, type=localized_type),
        reply_markup=get_regions_keyboard(lang),
        parse_mode="Markdown",
    )

    await state.set_state(ReportStates.waiting_for_region)


@router.message(ReportStates.waiting_for_location, F.location)
async def process_location(message: Message, state: FSMContext):
    """Process location from user"""
    data = await state.get_data()
    lang = get_user_language(data)

    # Сохраняем геолокацию
    location_data = {
        "latitude": message.location.latitude,
        "longitude": message.location.longitude,
        "source": "user_location",
    }

    # Получаем адрес по координатам
    address = await get_address_from_coordinates(
        message.location.latitude, message.location.longitude
    )
    location_data["address"] = address

    # Определяем регион и город из адреса
    region = "Не определен"
    city = "Не определен"

    # Пытаемся определить регион и город из адреса
    if address:
        # Разбиваем адрес на части
        address_parts = [part.strip() for part in address.split(",")]

        # Сначала ищем город
        for part in address_parts:
            for reg, cities in REGIONS_CITIES.items():
                if part in cities:
                    region = reg
                    city = part
                    break
            if region != "Не определен":
                break

        # Если город не найден, ищем регион
        if region == "Не определен":
            for part in address_parts:
                if part in REGIONS_CITIES:
                    region = part
                    # Берем первый город из списка городов региона
                    if REGIONS_CITIES[region]:
                        city = REGIONS_CITIES[region][0]
                    break

    # Если регион и город все еще не определены, используем координаты для определения
    if region == "Не определен" or city == "Не определен":
        # Определяем регион по координатам
        for reg, cities in REGIONS_CITIES.items():
            for city_name in cities:
                city_coords = get_city_coordinates(city_name)
                if city_coords:
                    # Простая проверка на близость координат
                    lat_diff = abs(city_coords["latitude"] - message.location.latitude)
                    lon_diff = abs(
                        city_coords["longitude"] - message.location.longitude
                    )
                    if lat_diff < 1 and lon_diff < 1:  # Примерно 100 км
                        region = reg
                        city = city_name
                        break
            if region != "Не определен":
                break

    await state.update_data(location=location_data, region=region, city=city)

    await message.answer(
        get_text("location_selected", lang), reply_markup=ReplyKeyboardRemove()
    )

    # Переходим к вводу текста обращения
    await message.answer(
        f"✅ Тип обращения: **{data.get('type')}**\n"
        f"✅ Регион: **{region}**\n"
        f"✅ Населенный пункт: **{city}**\n"
        f"✅ Адрес: **{address}**\n\n"
        f"Изложите суть обращения:",
        parse_mode="Markdown",
    )

    await state.set_state(ReportStates.waiting_for_report_text)


@router.callback_query(F.data == "back_to_main")
async def back_to_main(callback: CallbackQuery, state: FSMContext):
    """Go back to main menu"""
    await callback.answer()

    data = await state.get_data()
    lang = get_user_language(data)

    # Preserve language setting but clear other data
    await state.clear()
    await state.update_data(language=lang)

    await callback.message.edit_text(
        get_text("choose_action", lang), reply_markup=get_main_menu_keyboard(lang)
    )


@router.callback_query(F.data == "back_to_report_types")
async def back_to_report_types(callback: CallbackQuery, state: FSMContext):
    """Go back to report type selection"""
    await callback.answer()

    data = await state.get_data()
    lang = get_user_language(data)

    # Keep user data but clear report-specific data
    await state.update_data(
        type=None,
        region=None,
        city=None,
        report_text=None,
        user_name=None,
        location=None,
    )

    await callback.message.edit_text(
        get_text("creating_report", lang),
        reply_markup=get_report_types_keyboard(lang),
        parse_mode="Markdown",
    )

    await state.set_state(ReportStates.waiting_for_report_type)


@router.callback_query(F.data == "back_to_regions")
async def back_to_regions(callback: CallbackQuery, state: FSMContext):
    """Go back to regions selection"""
    await callback.answer()

    data = await state.get_data()
    lang = get_user_language(data)
    report_type = data.get("type", "Не выбран")

    # Clear region and city data
    await state.update_data(region=None, city=None, location=None)

    localized_type = (
        get_report_type_name(report_type, lang)
        if report_type != "Не выбран"
        else report_type
    )

    await callback.message.edit_text(
        get_text("select_region", lang, type=localized_type),
        reply_markup=get_regions_keyboard(lang),
        parse_mode="Markdown",
    )

    await state.set_state(ReportStates.waiting_for_region)


@router.callback_query(F.data.startswith("city:"))
async def process_city(callback: CallbackQuery, state: FSMContext):
    """Process city selection"""
    await callback.answer()

    city = callback.data.split(":", 1)[1]

    # Сохраняем выбранный город
    await state.update_data(city=city)

    data = await state.get_data()
    lang = get_user_language(data)

    # Удаляем сообщение с выбором города
    await callback.message.delete()

    # Просим ввести адрес или пропустить с Inline-кнопкой
    await callback.message.answer(
        get_text("request_address", lang, city=city),
        reply_markup=get_skip_address_inline_keyboard(
            lang
        ),  # Используем новую Inline-клавиатуру
        parse_mode="Markdown",
    )

    await state.set_state(ReportStates.waiting_for_address)


@router.message(ReportStates.waiting_for_report_text)
async def process_report_text(message: Message, state: FSMContext):
    """Process report text and move to photo step for complaints"""
    data = await state.get_data()
    lang = get_user_language(data)
    report_type = data.get("type")

    if len(message.text) < 10:
        await message.answer(get_text("text_too_short", lang))
        return

    await state.update_data(report_text=message.text)

    # For complaints, ask for photo
    if report_type == "Жалоба":
        await message.answer(
            get_text("enter_photo", lang),
            reply_markup=get_skip_location_inline_keyboard(lang)  # Using the same skip button style
        )
        await state.set_state(ReportStates.waiting_for_photo)
    else:
        # For recommendations, go straight to contact info
        await message.answer(get_text("enter_contact_info", lang))
        await state.set_state(ReportStates.waiting_for_user_name)


@router.message(ReportStates.waiting_for_photo, F.photo)
async def process_photo(message: Message, state: FSMContext):
    """Process photo and move to solution step"""
    data = await state.get_data()
    lang = get_user_language(data)

    # Save the largest photo
    photo = message.photo[-1]
    
    # Download the photo
    file = await message.bot.get_file(photo.file_id)
    photo_data = await message.bot.download_file(file.file_path)
    
    # Store photo data
    await state.update_data(photo_data=photo_data.read())

    await message.answer(
        get_text("enter_solution", lang),
        reply_markup=get_skip_location_inline_keyboard(lang)  # Using the same skip button style
    )
    await state.set_state(ReportStates.waiting_for_solution)


@router.callback_query(F.data == "skip_location_selection", ReportStates.waiting_for_photo)
async def skip_photo(callback: CallbackQuery, state: FSMContext):
    """Handle photo skip"""
    await callback.answer()
    
    data = await state.get_data()
    lang = get_user_language(data)

    await callback.message.delete()
    await callback.message.answer(get_text("photo_skipped", lang))
    await callback.message.answer(
        get_text("enter_solution", lang),
        reply_markup=get_skip_location_inline_keyboard(lang)  # Using the same skip button style
    )
    await state.set_state(ReportStates.waiting_for_solution)


@router.message(ReportStates.waiting_for_solution)
async def process_solution(message: Message, state: FSMContext):
    """Process solution and move to contact info"""
    data = await state.get_data()
    lang = get_user_language(data)

    await state.update_data(solution=message.text)
    await message.answer(get_text("enter_contact_info", lang))
    await state.set_state(ReportStates.waiting_for_user_name)


@router.message(ReportStates.waiting_for_user_name)
async def process_user_name(message: Message, state: FSMContext):
    """Process user name input"""
    data = await state.get_data()
    lang = get_user_language(data)

    if len(message.text) < 2:
        await message.answer(get_text("contact_too_short", lang))
        return

    await state.update_data(user_name=message.text)

    await message.answer(get_text("location_determined", lang))

    await show_report_confirmation(message, state)


async def show_report_confirmation(message: Message, state: FSMContext):
    """Show report confirmation"""
    data = await state.get_data()
    lang = get_user_language(data)

    # Validate data
    is_valid, validation_message = validate_report_data(data)

    if not is_valid:
        await message.answer(f"❌ Ошибка валидации: {validation_message}")
        return

    # Format report for preview
    report_preview = await format_report(data, lang)

    await message.answer(
        get_text("report_preview", lang, report=report_preview),
        reply_markup=get_confirmation_keyboard(lang),
        parse_mode="Markdown",
    )

    await state.set_state(ReportStates.confirming_report)


@router.callback_query(F.data == "confirm_report")
async def confirm_report(callback: CallbackQuery, state: FSMContext):
    """Confirm and send report"""
    await callback.answer()

    data = await state.get_data()
    lang = get_user_language(data)

    # Show processing message
    await callback.message.edit_text(
        get_text("processing", lang), parse_mode="Markdown"
    )

    # Initialize variables
    api_response = None
    registration_number = None

    # Try to send to Django backend first
    if API_ENABLED:
        try:
            # First check if backend is healthy
            health_check = await check_backend_health()
            if not health_check.get("success"):
                logging.warning(
                    f"Backend health check failed: {health_check.get('message')}"
                )

            # Send the report
            api_response = await send_report_to_api(data)
            if api_response.get("success"):
                registration_number = api_response.get("data", {}).get(
                    "id", "API_SUCCESS"
                )
                service = api_response.get("data", {}).get("service", "Unknown")
                agency = api_response.get("data", {}).get("agency", "Unknown")
                logging.info(
                    f"Report sent to Django backend successfully: {registration_number}"
                )
                logging.info(f"Report classified as: {service} -> {agency}")
            else:
                logging.error(
                    f"Django API submission failed: {api_response.get('message')}"
                )
        except Exception as e:
            logging.error(f"Error sending to Django API: {e}")

    # Save report to file as backup
    filename = await save_report_to_file(data)

    # Use API registration number if available, otherwise use filename
    if not registration_number:
        registration_number = filename.split("/")[-1] if filename else "LOCAL_BACKUP"

    # Format final report
    final_report = await format_report(data, lang)

    # Send to admin if configured
    if ADMIN_USER_ID:
        try:
            admin_message = f"🆕 **НОВОЕ ОБРАЩЕНИЕ**\n\n{final_report}"
            if api_response:
                if api_response.get("success"):
                    service = api_response.get("data", {}).get("service", "Unknown")
                    agency = api_response.get("data", {}).get("agency", "Unknown")
                    admin_message += (
                        f"\n\n✅ **Django Backend:** Успешно отправлено и обработано"
                    )
                    admin_message += f"\n🔍 **Классификация:** {service}"
                    admin_message += f"\n🏛️ **Ведомство:** {agency}"
                else:
                    admin_message += f"\n\n❌ **Django Backend:** {api_response.get('message', 'Ошибка')}"

            await callback.bot.send_message(
                ADMIN_USER_ID, admin_message, parse_mode="Markdown"
            )
        except Exception as e:
            logging.error(f"Failed to send report to admin: {e}")

    # Prepare success message
    if api_response and api_response.get("success"):
        success_message = get_text(
            "report_accepted_api", lang, number=registration_number
        )
    else:
        success_message = get_text(
            "report_accepted_local", lang, number=registration_number
        )

    await callback.message.edit_text(success_message, parse_mode="Markdown")

    # Show main menu again
    await callback.message.answer(
        get_text("choose_action", lang), reply_markup=get_main_menu_keyboard(lang)
    )

    await state.clear()


@router.callback_query(F.data == "cancel_report")
async def cancel_report(callback: CallbackQuery, state: FSMContext):
    """Cancel report creation"""
    await callback.answer()

    data = await state.get_data()
    lang = get_user_language(data)

    await callback.message.edit_text(get_text("report_cancelled", lang))

    await callback.message.answer(
        get_text("choose_action", lang), reply_markup=get_main_menu_keyboard(lang)
    )

    await state.clear()


@router.callback_query(F.data == "edit_report")
async def edit_report(callback: CallbackQuery, state: FSMContext):
    """Edit report - restart the process"""
    await callback.answer()

    await callback.message.edit_text(
        "✏️ Редактирование обращения. Начинаем заново.\n\n" "Выберите тип обращения:",
        reply_markup=get_report_types_keyboard(),
    )

    # Keep user data but restart the process
    data = await state.get_data()
    await state.clear()
    await state.update_data(
        user_id=data.get("user_id"),
        username=data.get("username"),
        created_at=datetime.now().strftime("%d.%m.%Y %H:%M"),
    )

    await state.set_state(ReportStates.waiting_for_report_type)


@router.callback_query(F.data == "language")
async def show_language_selection(callback: CallbackQuery, state: FSMContext):
    """Show language selection"""
    await callback.answer()

    data = await state.get_data()
    lang = get_user_language(data)

    await callback.message.edit_text(
        get_text("select_language", lang),
        reply_markup=get_language_keyboard(),
        parse_mode="Markdown",
    )


@router.callback_query(F.data == "info")
async def show_info(callback: CallbackQuery, state: FSMContext):
    """Show bot information"""
    await callback.answer()

    data = await state.get_data()
    lang = get_user_language(data)

    info_text = f"""
{get_text('info_title', lang)}

{get_text('info_description', lang)}

{get_text('info_types', lang)}

{get_text('info_regions', lang)}

{get_text('info_processing', lang)}
"""

    await callback.message.edit_text(
        info_text, reply_markup=get_main_menu_keyboard(lang), parse_mode="Markdown"
    )


@router.callback_query(F.data.startswith("region:"))
async def process_region(callback: CallbackQuery, state: FSMContext):
    """Process region selection"""
    await callback.answer()

    data = await state.get_data()
    lang = get_user_language(data)

    region = callback.data.split(":", 1)[1]
    await state.update_data(region=region)

    localized_region = get_region_name(region, lang)

    # Показываем выбор города
    await callback.message.edit_text(
        get_text("select_city", lang, region=localized_region),
        reply_markup=get_cities_keyboard(region, lang),
        parse_mode="Markdown",
    )

    await state.set_state(ReportStates.waiting_for_city)


@router.message(ReportStates.waiting_for_address, F.text)
async def process_address(message: Message, state: FSMContext):
    """Process address input"""
    data = await state.get_data()
    lang = get_user_language(data)

    address = message.text
    city = data.get("city")

    # Пытаемся получить координаты по введенному адресу
    location_data = get_city_coordinates(f"{address}, {city}")

    # Если Google Maps не дал координаты, используем координаты города
    if not location_data or location_data.get("source") != "google_maps":
        location_data = get_city_coordinates(city)

    await state.update_data(
        address=address,  # Сохраняем введенный адрес
        location=location_data,  # Сохраняем полученные координаты
    )

    await message.answer(
        get_text("address_received", lang), reply_markup=ReplyKeyboardRemove()
    )

    # Переходим к вводу текста обращения
    await message.answer(
        f"✅ Тип обращения: **{data.get('type')}**\n"
        f"✅ Регион: **{data.get('region')}**\n"
        f"✅ Населенный пункт: **{city}**\n"
        f"✅ Адрес: **{address}**\n"
        f"Изложите суть обращения:",
        parse_mode="Markdown",
    )

    await state.set_state(ReportStates.waiting_for_report_text)


@router.callback_query(F.data == "skip_address_input", ReportStates.waiting_for_address)
async def skip_address_inline(callback: CallbackQuery, state: FSMContext):
    """Handle skip address input from inline keyboard"""
    await callback.answer()

    data = await state.get_data()
    lang = get_user_language(data)
    city = data.get("city")

    # Удаляем сообщение с кнопкой пропуска
    await callback.message.delete()

    # Используем координаты города, если адрес пропущен
    location_data = get_city_coordinates(city)
    await state.update_data(
        address="Не указан",  # Сохраняем, что адрес не указан
        location=location_data,  # Сохраняем координаты города
    )

    await callback.message.answer(
        get_text("address_skipped", lang),  # Можно использовать тот же текст или другой
        reply_markup=ReplyKeyboardRemove(),  # Убираем Reply клавиатуру, если она была
    )

    # Переходим к вводу текста обращения
    await callback.message.answer(
        f"✅ Тип обращения: **{data.get('type')}**\n"
        f"✅ Регион: **{data.get('region')}**\n"
        f"✅ Населенный пункт: **{city}**\n"
        f"Изложите суть обращения:",
        parse_mode="Markdown",
    )

    await state.set_state(ReportStates.waiting_for_report_text)


@router.callback_query(F.data == "skip_location_selection", ReportStates.waiting_for_solution)
async def skip_solution(callback: CallbackQuery, state: FSMContext):
    """Handle solution skip"""
    await callback.answer()
    
    data = await state.get_data()
    lang = get_user_language(data)

    await callback.message.delete()
    await callback.message.answer(get_text("solution_skipped", lang))
    await callback.message.answer(get_text("enter_contact_info", lang))
    await state.set_state(ReportStates.waiting_for_user_name)


# Handle any other messages during states
@router.message()
async def handle_unexpected_message(message: Message, state: FSMContext):
    """Handle unexpected messages"""
    current_state = await state.get_state()

    if current_state:
        await message.answer(
            "❌ Следуйте инструкциям или используйте /cancel для отмены."
        )
    else:
        await message.answer(
            "Для начала работы с системой используйте команду /start",
            reply_markup=get_main_menu_keyboard(),
        )
