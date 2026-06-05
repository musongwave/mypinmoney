import json
import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))
from sync import make_pin_id, load_pins, prepend_pin, upload_to_cloudinary


def test_make_pin_id_is_deterministic():
    url = "https://res.cloudinary.com/demo/image/upload/mypinmoney/test.jpg"
    assert make_pin_id(url) == make_pin_id(url)


def test_make_pin_id_is_12_chars():
    assert len(make_pin_id("https://example.com/image.jpg")) == 12


def test_load_pins_returns_empty_list_when_file_missing(tmp_path):
    assert load_pins(tmp_path / "nonexistent.json") == []


def test_load_pins_returns_list_from_file(tmp_path):
    pins_file = tmp_path / "pins.json"
    pins_file.write_text(json.dumps([{"id": "abc"}]))
    assert load_pins(pins_file) == [{"id": "abc"}]


def test_prepend_pin_adds_to_front(tmp_path):
    pins_file = tmp_path / "pins.json"
    pins_file.write_text(json.dumps([{"id": "old"}]))
    prepend_pin(pins_file, {"id": "new"})
    result = json.loads(pins_file.read_text())
    assert result[0]["id"] == "new"
    assert result[1]["id"] == "old"


def test_prepend_pin_skips_duplicate(tmp_path):
    pins_file = tmp_path / "pins.json"
    pins_file.write_text(json.dumps([{"id": "abc"}]))
    prepend_pin(pins_file, {"id": "abc"})
    result = json.loads(pins_file.read_text())
    assert len(result) == 1


def test_upload_to_cloudinary_returns_secure_url():
    mock_result = {"secure_url": "https://res.cloudinary.com/demo/image/upload/mypinmoney/test.jpg"}
    with patch("cloudinary.uploader.upload", return_value=mock_result):
        url = upload_to_cloudinary(Path("/tmp/test.jpg"))
    assert url == mock_result["secure_url"]
