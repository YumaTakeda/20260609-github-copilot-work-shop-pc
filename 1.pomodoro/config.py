class BaseConfig:
    TESTING = False
    DATABASE = "pomodoro.db"
    DEFAULT_WORK_MIN = 25
    DEFAULT_SHORT_BREAK_MIN = 5
    DEFAULT_LONG_BREAK_MIN = 15
    DEFAULT_LONG_BREAK_EVERY = 4


class DevelopmentConfig(BaseConfig):
    DEBUG = True


class TestingConfig(BaseConfig):
    TESTING = True
    DATABASE = ":memory:"


class ProductionConfig(BaseConfig):
    DEBUG = False
