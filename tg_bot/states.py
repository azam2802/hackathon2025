from aiogram.fsm.state import State, StatesGroup


class ReportStates(StatesGroup):
    waiting_for_report_type = State()
    waiting_for_region = State()
    waiting_for_location = State()
    waiting_for_city = State()
    waiting_for_address = State()
    waiting_for_report_text = State()
    waiting_for_photo = State()
    waiting_for_solution = State()
    waiting_for_user_name = State()
    confirming_report = State()
