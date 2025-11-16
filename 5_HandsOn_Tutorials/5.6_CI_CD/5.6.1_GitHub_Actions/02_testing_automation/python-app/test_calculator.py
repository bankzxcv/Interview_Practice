"""Tests for calculator module."""

import pytest
from calculator import Calculator


class TestCalculator:
    """Test cases for Calculator class."""

    @pytest.fixture
    def calc(self):
        """Fixture to create a Calculator instance."""
        return Calculator()

    def test_add(self, calc):
        """Test addition."""
        assert calc.add(2, 3) == 5
        assert calc.add(-1, 1) == 0
        assert calc.add(0, 0) == 0
        assert calc.add(100, 200) == 300
        assert calc.add(-5, -5) == -10

    def test_subtract(self, calc):
        """Test subtraction."""
        assert calc.subtract(5, 3) == 2
        assert calc.subtract(0, 5) == -5
        assert calc.subtract(-1, -1) == 0
        assert calc.subtract(10, 3) == 7
        assert calc.subtract(-10, 5) == -15

    def test_multiply(self, calc):
        """Test multiplication."""
        assert calc.multiply(3, 4) == 12
        assert calc.multiply(-2, 3) == -6
        assert calc.multiply(0, 100) == 0
        assert calc.multiply(5, 5) == 25
        assert calc.multiply(-3, -3) == 9

    def test_divide(self, calc):
        """Test division."""
        assert calc.divide(10, 2) == 5
        assert calc.divide(7, 2) == 3.5
        assert calc.divide(-10, 2) == -5
        assert calc.divide(100, 10) == 10
        assert calc.divide(1, 4) == 0.25

    def test_divide_by_zero(self, calc):
        """Test division by zero raises error."""
        with pytest.raises(ValueError, match="Cannot divide by zero"):
            calc.divide(10, 0)

    def test_power(self, calc):
        """Test exponentiation."""
        assert calc.power(2, 3) == 8
        assert calc.power(5, 0) == 1
        assert calc.power(2, -1) == 0.5
        assert calc.power(10, 2) == 100
        assert calc.power(3, 3) == 27

    def test_modulo(self, calc):
        """Test modulo operation."""
        assert calc.modulo(10, 3) == 1
        assert calc.modulo(15, 4) == 3
        assert calc.modulo(20, 5) == 0
        assert calc.modulo(7, 2) == 1

    def test_modulo_by_zero(self, calc):
        """Test modulo by zero raises error."""
        with pytest.raises(ValueError, match="Cannot calculate modulo with zero"):
            calc.modulo(10, 0)

    @pytest.mark.parametrize("a,b,expected", [
        (1, 1, 2),
        (0, 0, 0),
        (-1, 1, 0),
        (100, -50, 50),
    ])
    def test_add_parametrized(self, calc, a, b, expected):
        """Test addition with parametrized inputs."""
        assert calc.add(a, b) == expected

    @pytest.mark.parametrize("a,b,expected", [
        (10, 2, 5),
        (100, 10, 10),
        (15, 3, 5),
        (-20, 4, -5),
    ])
    def test_divide_parametrized(self, calc, a, b, expected):
        """Test division with parametrized inputs."""
        assert calc.divide(a, b) == expected
