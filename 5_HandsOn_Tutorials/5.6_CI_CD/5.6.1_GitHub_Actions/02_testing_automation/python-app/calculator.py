"""Calculator module with basic operations."""


class Calculator:
    """A simple calculator class."""

    def add(self, a, b):
        """Add two numbers.

        Args:
            a: First number
            b: Second number

        Returns:
            Sum of a and b
        """
        return a + b

    def subtract(self, a, b):
        """Subtract b from a.

        Args:
            a: First number
            b: Second number

        Returns:
            Difference of a and b
        """
        return a - b

    def multiply(self, a, b):
        """Multiply two numbers.

        Args:
            a: First number
            b: Second number

        Returns:
            Product of a and b
        """
        return a * b

    def divide(self, a, b):
        """Divide a by b.

        Args:
            a: Numerator
            b: Denominator

        Returns:
            Quotient of a and b

        Raises:
            ValueError: If b is zero
        """
        if b == 0:
            raise ValueError("Cannot divide by zero")
        return a / b

    def power(self, base, exponent):
        """Raise base to the power of exponent.

        Args:
            base: Base number
            exponent: Exponent

        Returns:
            base raised to exponent
        """
        return base ** exponent

    def modulo(self, a, b):
        """Calculate a modulo b.

        Args:
            a: Dividend
            b: Divisor

        Returns:
            Remainder of a divided by b

        Raises:
            ValueError: If b is zero
        """
        if b == 0:
            raise ValueError("Cannot calculate modulo with zero")
        return a % b
