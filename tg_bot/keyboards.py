from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, ReplyKeyboardMarkup, KeyboardButton
from aiogram.utils.keyboard import InlineKeyboardBuilder, ReplyKeyboardBuilder
from config import REGIONS_CITIES, REPORT_TYPES


def get_report_types_keyboard() -> InlineKeyboardMarkup:
    """Create keyboard for report types selection"""
    builder = InlineKeyboardBuilder()
    
    for report_type in REPORT_TYPES:
        builder.add(InlineKeyboardButton(
            text=report_type,
            callback_data=f"report_type:{report_type}"
        ))
    
    builder.adjust(1)
    return builder.as_markup()


def get_regions_keyboard() -> InlineKeyboardMarkup:
    """Create keyboard for regions selection"""
    builder = InlineKeyboardBuilder()
    
    for region in REGIONS_CITIES.keys():
        builder.add(InlineKeyboardButton(
            text=region,
            callback_data=f"region:{region}"
        ))
    
    builder.adjust(2)
    return builder.as_markup()


def get_cities_keyboard(region: str) -> InlineKeyboardMarkup:
    """Create keyboard for cities selection based on region"""
    builder = InlineKeyboardBuilder()
    
    cities = REGIONS_CITIES.get(region, [])
    for city in cities:
        builder.add(InlineKeyboardButton(
            text=city,
            callback_data=f"city:{city}"
        ))
    
    # Add back button
    builder.add(InlineKeyboardButton(
        text="⬅️ Вернуться к регионам",
        callback_data="back_to_regions"
    ))
    
    builder.adjust(2)
    return builder.as_markup()





def get_confirmation_keyboard() -> InlineKeyboardMarkup:
    """Create keyboard for report confirmation"""
    builder = InlineKeyboardBuilder()
    
    builder.add(InlineKeyboardButton(
        text="✅ Подтвердить отправку",
        callback_data="confirm_report"
    ))
    
    builder.add(InlineKeyboardButton(
        text="❌ Отменить",
        callback_data="cancel_report"
    ))
    
    builder.add(InlineKeyboardButton(
        text="✏️ Редактировать",
        callback_data="edit_report"
    ))
    
    builder.adjust(1)
    return builder.as_markup()


def get_main_menu_keyboard() -> InlineKeyboardMarkup:
    """Create main menu keyboard"""
    builder = InlineKeyboardBuilder()
    
    builder.add(InlineKeyboardButton(
        text="📝 Подать обращение",
        callback_data="create_report"
    ))
    
    builder.add(InlineKeyboardButton(
        text="ℹ️ Информация",
        callback_data="info"
    ))
    
    builder.adjust(1)
    return builder.as_markup() 