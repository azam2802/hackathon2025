import logging
from datetime import datetime
from typing import Dict, Any

from aiogram import Router, F
from aiogram.types import Message, CallbackQuery, ReplyKeyboardRemove
from aiogram.filters import CommandStart, Command
from aiogram.fsm.context import FSMContext

from states import ReportStates
from keyboards import (
    get_main_menu_keyboard, get_report_types_keyboard, get_regions_keyboard,
    get_cities_keyboard, get_confirmation_keyboard
)
from utils import (
    format_report, get_address_from_coordinates, save_report_to_file,
    validate_report_data, escape_markdown, get_city_coordinates
)
from config import ADMIN_USER_ID, API_ENABLED
from api_client import send_report_to_api

router = Router()


@router.message(CommandStart())
async def start_command(message: Message, state: FSMContext):
    """Handle /start command"""
    await state.clear()
    
    welcome_text = f"""
🏛️ Добро пожаловать в систему обращений по государственным услугам Кыргызской Республики.

Данная система предназначена для подачи жалоб и рекомендаций по качеству предоставления государственных услуг.

Выберите действие:
"""
    
    await message.answer(
        welcome_text,
        reply_markup=get_main_menu_keyboard()
    )


@router.message(Command("help"))
async def help_command(message: Message):
    """Handle /help command"""
    help_text = """
ℹ️ **Инструкция по использованию системы**

**Доступные команды:**
• /start - Начать работу с системой
• /help - Показать данную инструкцию
• /cancel - Отменить текущее действие

**Порядок подачи обращения:**
1. Нажмите "📝 Подать обращение"
2. Выберите тип обращения (Жалоба/Рекомендации)
3. Выберите регион
4. Выберите населенный пункт
5. Изложите суть обращения
6. Укажите контактные данные
7. Подтвердите отправку

**Техническая поддержка:** По вопросам работы системы обращайтесь к администратору.
"""
    
    await message.answer(help_text, parse_mode="Markdown")


@router.message(Command("cancel"))
async def cancel_command(message: Message, state: FSMContext):
    """Handle /cancel command"""
    await state.clear()
    await message.answer(
        "❌ Действие отменено.",
        reply_markup=ReplyKeyboardRemove()
    )
    await message.answer(
        "Выберите действие:",
        reply_markup=get_main_menu_keyboard()
    )


@router.callback_query(F.data == "create_report")
async def start_report_creation(callback: CallbackQuery, state: FSMContext):
    """Start report creation process"""
    await callback.answer()
    
    # Initialize report data
    await state.update_data(
        user_id=callback.from_user.id,
        username=callback.from_user.username or "Не указан",
        created_at=datetime.now().strftime('%d.%m.%Y %H:%M')
    )
    
    await callback.message.edit_text(
        "📝 **Подача обращения**\n\nВыберите тип обращения:",
        reply_markup=get_report_types_keyboard(),
        parse_mode="Markdown"
    )
    
    await state.set_state(ReportStates.waiting_for_report_type)


@router.callback_query(F.data.startswith("report_type:"))
async def process_report_type(callback: CallbackQuery, state: FSMContext):
    """Process report type selection"""
    await callback.answer()
    
    report_type = callback.data.split(":", 1)[1]
    await state.update_data(type=report_type)
    
    await callback.message.edit_text(
        f"✅ Тип обращения: **{report_type}**\n\nВыберите регион:",
        reply_markup=get_regions_keyboard(),
        parse_mode="Markdown"
    )
    
    await state.set_state(ReportStates.waiting_for_region)


@router.callback_query(F.data.startswith("region:"))
async def process_region(callback: CallbackQuery, state: FSMContext):
    """Process region selection"""
    await callback.answer()
    
    region = callback.data.split(":", 1)[1]
    await state.update_data(region=region)
    
    await callback.message.edit_text(
        f"✅ Регион: **{region}**\n\nВыберите населенный пункт:",
        reply_markup=get_cities_keyboard(region),
        parse_mode="Markdown"
    )
    
    await state.set_state(ReportStates.waiting_for_city)


@router.callback_query(F.data == "back_to_regions")
async def back_to_regions(callback: CallbackQuery, state: FSMContext):
    """Go back to regions selection"""
    await callback.answer()
    
    data = await state.get_data()
    report_type = data.get('type', 'Не выбран')
    
    await callback.message.edit_text(
        f"✅ Тип обращения: **{report_type}**\n\nВыберите регион:",
        reply_markup=get_regions_keyboard(),
        parse_mode="Markdown"
    )
    
    await state.set_state(ReportStates.waiting_for_region)


@router.callback_query(F.data.startswith("city:"))
async def process_city(callback: CallbackQuery, state: FSMContext):
    """Process city selection"""
    await callback.answer()
    
    city = callback.data.split(":", 1)[1]
    
    # Get coordinates for the selected city
    city_location = get_city_coordinates(city)
    
    await state.update_data(
        city=city,
        location=city_location  # Automatically set location based on city
    )
    
    data = await state.get_data()
    
    location_info = ""
    if city_location:
        location_info = f"\n📍 Координаты: {city_location['latitude']:.4f}, {city_location['longitude']:.4f}"
    
    await callback.message.edit_text(
        f"✅ Тип обращения: **{data.get('type')}**\n"
        f"✅ Регион: **{data.get('region')}**\n"
        f"✅ Населенный пункт: **{city}**{location_info}\n\n"
        f"Изложите суть обращения:",
        parse_mode="Markdown"
    )
    
    await state.set_state(ReportStates.waiting_for_report_text)


@router.message(ReportStates.waiting_for_report_text)
async def process_report_text(message: Message, state: FSMContext):
    """Process report text input"""
    if len(message.text) < 10:
        await message.answer(
            "❌ Текст обращения слишком короткий. Минимальная длина - 10 символов."
        )
        return
    
    await state.update_data(report_text=message.text)
    
    await message.answer(
        "✅ Текст обращения принят.\n\n"
        "Укажите ваши контактные данные (ФИО):"
    )
    
    await state.set_state(ReportStates.waiting_for_user_name)


@router.message(ReportStates.waiting_for_user_name)
async def process_user_name(message: Message, state: FSMContext):
    """Process user name input"""
    if len(message.text) < 2:
        await message.answer(
            "❌ Контактные данные слишком короткие. Минимальная длина - 2 символа."
        )
        return
    
    await state.update_data(user_name=message.text)
    
    await message.answer(
        "✅ Контактные данные сохранены.\n\n"
    )
    
    await show_report_confirmation(message, state)





async def show_report_confirmation(message: Message, state: FSMContext):
    """Show report confirmation"""
    data = await state.get_data()
    
    # Validate data
    is_valid, validation_message = validate_report_data(data)
    
    if not is_valid:
        await message.answer(f"❌ Ошибка валидации: {validation_message}")
        return
    
    # Format report for preview
    report_preview = await format_report(data)
    
    await message.answer(
        f"📋 **Предварительный просмотр обращения:**\n\n{report_preview}\n\n"
        f"Проверьте данные и подтвердите отправку:",
        reply_markup=get_confirmation_keyboard(),
        parse_mode="Markdown"
    )
    
    await state.set_state(ReportStates.confirming_report)


@router.callback_query(F.data == "confirm_report")
async def confirm_report(callback: CallbackQuery, state: FSMContext):
    """Confirm and send report"""
    await callback.answer()
    
    data = await state.get_data()
    
    # Show processing message
    await callback.message.edit_text(
        "⏳ **Обработка обращения...**\n\nПожалуйста, подождите.",
        parse_mode="Markdown"
    )
    
    # Initialize variables
    api_response = None
    registration_number = None
    
    # Try to send to API first
    if API_ENABLED:
        try:
            api_response = await send_report_to_api(data)
            if api_response.get('success'):
                registration_number = api_response.get('data', {}).get('id', 'API_SUCCESS')
                logging.info(f"Report sent to API successfully: {registration_number}")
            else:
                logging.error(f"API submission failed: {api_response.get('message')}")
        except Exception as e:
            logging.error(f"Error sending to API: {e}")
    
    # Save report to file as backup
    filename = await save_report_to_file(data)
    
    # Use API registration number if available, otherwise use filename
    if not registration_number:
        registration_number = filename.split('/')[-1] if filename else 'LOCAL_BACKUP'
    
    # Format final report
    final_report = await format_report(data)
    
    # Send to admin if configured
    if ADMIN_USER_ID:
        try:
            admin_message = f"🆕 **НОВОЕ ОБРАЩЕНИЕ**\n\n{final_report}"
            if api_response:
                if api_response.get('success'):
                    admin_message += f"\n\n✅ **Статус API:** Успешно отправлено"
                else:
                    admin_message += f"\n\n❌ **Статус API:** {api_response.get('message', 'Ошибка')}"
            
            await callback.bot.send_message(
                ADMIN_USER_ID,
                admin_message,
                parse_mode="Markdown"
            )
        except Exception as e:
            logging.error(f"Failed to send report to admin: {e}")
    
    # Prepare success message
    if api_response and api_response.get('success'):
        success_message = (
            "✅ **Обращение принято к рассмотрению**\n\n"
            "Ваше обращение успешно зарегистрировано в системе и будет рассмотрено "
            "в установленные законодательством сроки.\n\n"
            f"📁 **Регистрационный номер:** `{registration_number}`\n\n"
            "Вы можете использовать данный номер для отслеживания статуса обращения."
        )
    else:
        success_message = (
            "✅ **Обращение принято**\n\n"
            "Ваше обращение зарегистрировано локально. "
            "Администратор обработает его в ближайшее время.\n\n"
            f"📁 **Номер:** `{registration_number}`"
        )
    
    await callback.message.edit_text(
        success_message,
        parse_mode="Markdown"
    )
    
    # Show main menu again
    await callback.message.answer(
        "Выберите действие:",
        reply_markup=get_main_menu_keyboard()
    )
    
    await state.clear()


@router.callback_query(F.data == "cancel_report")
async def cancel_report(callback: CallbackQuery, state: FSMContext):
    """Cancel report creation"""
    await callback.answer()
    
    await callback.message.edit_text(
        "❌ Подача обращения отменена."
    )
    
    await callback.message.answer(
        "Выберите действие:",
        reply_markup=get_main_menu_keyboard()
    )
    
    await state.clear()


@router.callback_query(F.data == "edit_report")
async def edit_report(callback: CallbackQuery, state: FSMContext):
    """Edit report - restart the process"""
    await callback.answer()
    
    await callback.message.edit_text(
        "✏️ Редактирование обращения. Начинаем заново.\n\n"
        "Выберите тип обращения:",
        reply_markup=get_report_types_keyboard()
    )
    
    # Keep user data but restart the process
    data = await state.get_data()
    await state.clear()
    await state.update_data(
        user_id=data.get('user_id'),
        username=data.get('username'),
        created_at=datetime.now().strftime('%d.%m.%Y %H:%M')
    )
    
    await state.set_state(ReportStates.waiting_for_report_type)


@router.callback_query(F.data == "info")
async def show_info(callback: CallbackQuery):
    """Show bot information"""
    await callback.answer()
    
    info_text = """
ℹ️ **Информация о системе**

Система предназначена для приема обращений граждан по вопросам качества государственных услуг в Кыргызской Республике.

**Типы обращений:**
• 📝 Жалоба - сообщение о нарушениях при предоставлении услуг
• 💡 Рекомендации - предложения по улучшению качества услуг

**Территориальный охват:**
• г. Бишкек
• г. Ош
• Чуйская область
• Ошская область
• Джалал-Абадская область
• Баткенская область
• Нарынская область
• Иссык-Кульская область
• Таласская область

Все обращения регистрируются и направляются в соответствующие государственные органы для рассмотрения.
"""
    
    await callback.message.edit_text(
        info_text,
        reply_markup=get_main_menu_keyboard(),
        parse_mode="Markdown"
    )


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
            reply_markup=get_main_menu_keyboard()
        ) 