import asyncio
import logging
import sys
from aiogram import Dispatcher
from aiogram.fsm.storage.memory import MemoryStorage
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import BOT_TOKEN
from handlers import router as bot_router
from api_endpoints import router as api_router
from instances import bot

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)

# Check if bot token is provided
if not BOT_TOKEN:
    logging.error("BOT_TOKEN is not set! Please set it in your .env file")
    sys.exit(1)

# Use memory storage for FSM
storage = MemoryStorage()
dp = Dispatcher(storage=storage)

# Include bot router
dp.include_router(bot_router)

# Initialize FastAPI app
app = FastAPI(title="Government Services Bot API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router)

@app.on_event("startup")
async def startup():
    """Startup event handler"""
    logging.info("Starting bot...")
    try:
        # Start polling in background
        asyncio.create_task(dp.start_polling(bot))
    except Exception as e:
        logging.error(f"Error occurred: {e}")
        sys.exit(1)

@app.on_event("shutdown")
async def shutdown():
    """Shutdown event handler"""
    logging.info("Shutting down bot...")
    await bot.session.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080) 