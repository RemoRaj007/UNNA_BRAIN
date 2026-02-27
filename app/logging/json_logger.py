import json
import logging
import sys


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            'level': record.levelname,
            'message': record.getMessage(),
            'logger': record.name,
            'request_id': getattr(record, 'request_id', None),
            'user_id': getattr(record, 'user_id', None),
        }
        return json.dumps(payload)


def configure_logging() -> None:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())
    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(logging.INFO)
