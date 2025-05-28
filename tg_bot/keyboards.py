from aiogram.types import (
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    ReplyKeyboardMarkup,
    KeyboardButton,
)
from aiogram.utils.keyboard import InlineKeyboardBuilder, ReplyKeyboardBuilder
from config import REGIONS_CITIES, REPORT_TYPES
from localization import get_text, get_region_name, get_report_type_name, LANGUAGES


def get_report_types_keyboard(lang: str = "ru") -> InlineKeyboardMarkup:
    """Create keyboard for report types selection"""
    builder = InlineKeyboardBuilder()

    for report_type in REPORT_TYPES:
        localized_name = get_report_type_name(report_type, lang)
        builder.add(
            InlineKeyboardButton(
                text=localized_name, callback_data=f"report_type:{report_type}"
            )
        )

    # Add back to main menu button
    builder.add(
        InlineKeyboardButton(
            text=get_text("back_to_main", lang), callback_data="back_to_main"
        )
    )

    builder.adjust(1)
    return builder.as_markup()


def get_regions_keyboard(lang: str = "ru") -> InlineKeyboardMarkup:
    """Create keyboard for regions selection"""
    builder = InlineKeyboardBuilder()

    for region in REGIONS_CITIES.keys():
        localized_name = get_region_name(region, lang)
        builder.add(
            InlineKeyboardButton(text=localized_name, callback_data=f"region:{region}")
        )

    # Add back to report types button
    builder.add(
        InlineKeyboardButton(
            text=get_text("back_to_report_types", lang),
            callback_data="back_to_report_types",
        )
    )

    builder.adjust(2)
    return builder.as_markup()


def get_cities_keyboard(region: str, lang: str = "ru") -> InlineKeyboardMarkup:
    """Create keyboard for cities selection based on region"""
    builder = InlineKeyboardBuilder()

    cities = REGIONS_CITIES.get(region, [])
    for city in cities:
        builder.add(InlineKeyboardButton(text=city, callback_data=f"city:{city}"))

    # Add back button
    builder.add(
        InlineKeyboardButton(
            text=get_text("back_to_regions", lang), callback_data="back_to_regions"
        )
    )

    builder.adjust(2)
    return builder.as_markup()


def get_confirmation_keyboard(lang: str = "ru") -> InlineKeyboardMarkup:
    """Create keyboard for report confirmation"""
    builder = InlineKeyboardBuilder()

    builder.add(
        InlineKeyboardButton(
            text=get_text("confirm_submit", lang), callback_data="confirm_report"
        )
    )

    builder.add(
        InlineKeyboardButton(
            text=get_text("cancel", lang), callback_data="cancel_report"
        )
    )

    builder.add(
        InlineKeyboardButton(text=get_text("edit", lang), callback_data="edit_report")
    )

    builder.adjust(1)
    return builder.as_markup()


def get_main_menu_keyboard(lang: str = "ru") -> InlineKeyboardMarkup:
    """Create main menu keyboard"""
    builder = InlineKeyboardBuilder()

    builder.add(
        InlineKeyboardButton(
            text=get_text("submit_report", lang), callback_data="create_report"
        )
    )

    builder.add(
        InlineKeyboardButton(text=get_text("information", lang), callback_data="info")
    )

    builder.add(
        InlineKeyboardButton(text=get_text("language", lang), callback_data="language")
    )

    builder.adjust(1)
    return builder.as_markup()


def get_language_keyboard() -> InlineKeyboardMarkup:
    """Create language selection keyboard"""
    builder = InlineKeyboardBuilder()

    for lang_code, lang_name in LANGUAGES.items():
        builder.add(
            InlineKeyboardButton(
                text=lang_name, callback_data=f"set_language:{lang_code}"
            )
        )

    builder.adjust(1)
    return builder.as_markup()


def get_location_keyboard(lang: str = "ru") -> ReplyKeyboardMarkup:
    """Create keyboard with location button"""
    builder = ReplyKeyboardBuilder()

    # Add location button
    builder.add(
        KeyboardButton(text=get_text("send_location", lang), request_location=True)
    )

    # Add skip button
    builder.add(KeyboardButton(text=get_text("skip_location", lang)))

    builder.adjust(1)
    return builder.as_markup()
