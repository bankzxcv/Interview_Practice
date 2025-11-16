# Testing Pulumi Code

## Overview
Learn to test infrastructure code with unit tests and integration tests.

## Unit Testing

```python
# tests/test_infra.py
import unittest
import pulumi

class TestInfrastructure(unittest.TestCase):
    @pulumi.runtime.test
    def test_bucket_creation(self):
        import infra
        
        def check_bucket(args):
            bucket_name, tags = args
            self.assertIsNotNone(bucket_name)
            self.assertEqual(tags['Environment'], 'test')
        
        return pulumi.Output.all(
            infra.bucket.id, 
            infra.bucket.tags
        ).apply(check_bucket)
```

## Running Tests

```bash
python -m pytest tests/
```

## Best Practices
1. Test resource properties
2. Validate outputs
3. Test edge cases
4. Mock external dependencies

## Next Steps
- Tutorial 07: CI/CD Integration
