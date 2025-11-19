# HCL (HashiCorp Configuration Language) Cheatsheet

> **Official Documentation:**
> - [HCL Syntax](https://developer.hashicorp.com/terraform/language/syntax/configuration)
> - [Functions Reference](https://developer.hashicorp.com/terraform/language/functions)
> - [Expressions](https://developer.hashicorp.com/terraform/language/expressions)

Comprehensive HCL guide covering syntax, all built-in functions, and best practices for HashiCorp tools (Terraform, Vault, Nomad, Consul).

---

## Table of Contents

1. [Basic Syntax](#basic-syntax)
2. [Data Types](#data-types)
3. [Variables & Locals](#variables--locals)
4. [Expressions & Operators](#expressions--operators)
5. [Conditionals & Loops](#conditionals--loops)
6. [Numeric Functions](#numeric-functions)
7. [String Functions](#string-functions)
8. [Collection Functions](#collection-functions)
9. [Encoding Functions](#encoding-functions)
10. [Filesystem Functions](#filesystem-functions)
11. [Date & Time Functions](#date--time-functions)
12. [Hash & Crypto Functions](#hash--crypto-functions)
13. [IP Network Functions](#ip-network-functions)
14. [Type Conversion Functions](#type-conversion-functions)
15. [Best Practices](#best-practices)

---

## Basic Syntax

```hcl
# Comments
# Single line comment
// Also single line comment
/* Multi-line
   comment */

# Blocks - fundamental construct
block_type "label1" "label2" {
  identifier = expression

  nested_block {
    key = "value"
  }
}

# Example: Resource block
resource "aws_instance" "web" {
  ami           = "ami-abc123"
  instance_type = "t2.micro"

  tags = {
    Name = "WebServer"
    Env  = "Production"
  }
}

# Arguments
argument_name = expression

# Attributes (reference)
resource_type.resource_name.attribute_name

# Example references
aws_instance.web.id
aws_instance.web.public_ip
var.instance_type
local.common_tags

# Interpolation (within strings)
"Hello, ${var.name}!"
"Instance IP: ${aws_instance.web.public_ip}"

# Heredoc strings
<<EOF
This is a multi-line
string with ${var.interpolation}
EOF

# Indented heredoc (strips leading whitespace)
<<-EOF
  This text will be
  unindented
EOF
```

---

## Data Types

```hcl
# Primitive Types

# String
variable "region" {
  type    = string
  default = "us-east-1"
}

# Number (int or float)
variable "instance_count" {
  type    = number
  default = 3
}

variable "cpu_threshold" {
  type    = number
  default = 0.75
}

# Boolean
variable "enable_monitoring" {
  type    = bool
  default = true
}

# Complex Types

# List (ordered collection of values)
variable "availability_zones" {
  type    = list(string)
  default = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

# Set (unordered collection of unique values)
variable "security_groups" {
  type    = set(string)
  default = ["sg-abc123", "sg-def456"]
}

# Map (key-value pairs)
variable "tags" {
  type = map(string)
  default = {
    Environment = "dev"
    Project     = "myapp"
    Owner       = "team@example.com"
  }
}

# Object (structured type with named attributes)
variable "server_config" {
  type = object({
    name          = string
    instance_type = string
    cpu_cores     = number
    enable_public = bool
  })

  default = {
    name          = "web-server"
    instance_type = "t2.micro"
    cpu_cores     = 2
    enable_public = true
  }
}

# Tuple (fixed-length ordered collection)
variable "server_details" {
  type    = tuple([string, number, bool])
  default = ["web-server", 2, true]
}

# Any type (accepts any value)
variable "dynamic_value" {
  type    = any
  default = "can be anything"
}

# Null value
variable "optional_value" {
  type    = string
  default = null
}

# Accessing values
local.zones[0]                    # "us-east-1a"
local.tags["Environment"]         # "dev"
local.config.name                 # "web-server"
local.details[1]                  # 2
```

### Visual: Type Hierarchy

```
HCL TYPE SYSTEM:
├── Primitive
│   ├── string
│   ├── number
│   ├── bool
│   └── null
└── Complex
    ├── Collection (same element type)
    │   ├── list(type)      [ordered]
    │   ├── set(type)       [unique, unordered]
    │   └── map(type)       [key-value]
    └── Structural (fixed schema)
        ├── object({...})   [named attributes]
        └── tuple([...])    [positional elements]

EXAMPLES:
list(string):        ["a", "b", "c"]
set(number):         [1, 2, 3]
map(string):         {key1 = "val1", key2 = "val2"}
object({x=number}):  {x = 42, y = "text"}
tuple([string,num]): ["text", 42]
```

---

## Variables & Locals

```hcl
# Input Variables
variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t2.micro"

  validation {
    condition     = contains(["t2.micro", "t2.small", "t2.medium"], var.instance_type)
    error_message = "Instance type must be t2.micro, t2.small, or t2.medium."
  }
}

variable "environment" {
  description = "Environment name"
  type        = string

  # No default = required variable
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}

  # nullable = true allows null value
  nullable = true
}

variable "instance_count" {
  description = "Number of instances"
  type        = number
  default     = 1

  # sensitive = true hides value in output
  sensitive = false
}

# Using variables
resource "aws_instance" "app" {
  ami           = "ami-abc123"
  instance_type = var.instance_type
  count         = var.instance_count

  tags = var.tags
}

# Local Values (computed values used multiple times)
locals {
  # Simple values
  region = "us-east-1"

  # Computed from variables
  environment_prefix = "${var.environment}-${var.project_name}"

  # Complex expressions
  common_tags = merge(
    var.tags,
    {
      Environment = var.environment
      ManagedBy   = "Terraform"
      CreatedAt   = timestamp()
    }
  )

  # Conditional logic
  instance_type = var.environment == "prod" ? "t2.large" : "t2.micro"

  # List manipulation
  availability_zones = slice(data.aws_availability_zones.available.names, 0, 3)

  # Object construction
  server_config = {
    name    = local.environment_prefix
    type    = local.instance_type
    subnets = local.availability_zones
  }
}

# Using locals
resource "aws_instance" "web" {
  ami           = "ami-abc123"
  instance_type = local.instance_type

  tags = local.common_tags
}

# Output Values
output "instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.web.id
}

output "public_ip" {
  description = "Public IP address"
  value       = aws_instance.web.public_ip
  sensitive   = true  # Hide in output
}

output "instance_details" {
  description = "Complete instance details"
  value = {
    id        = aws_instance.web.id
    public_ip = aws_instance.web.public_ip
    az        = aws_instance.web.availability_zone
  }
}
```

---

## Expressions & Operators

```hcl
locals {
  # Arithmetic Operators
  sum        = 5 + 3              # 8
  difference = 10 - 4             # 6
  product    = 6 * 7              # 42
  quotient   = 20 / 4             # 5
  remainder  = 17 % 5             # 2
  negative   = -5                 # -5

  # Comparison Operators
  equal          = 5 == 5         # true
  not_equal      = 5 != 3         # true
  less_than      = 3 < 5          # true
  less_equal     = 5 <= 5         # true
  greater_than   = 7 > 5          # true
  greater_equal  = 5 >= 5         # true

  # Logical Operators
  and_op  = true && false         # false
  or_op   = true || false         # true
  not_op  = !true                 # false

  # String Operators
  concat  = "Hello, " + "World!"  # "Hello, World!"

  # Conditional Expression (ternary)
  env_type = var.environment == "prod" ? "production" : "non-production"

  instance_count = var.enable_ha ? 3 : 1

  # Null coalescing
  region = var.custom_region != null ? var.custom_region : "us-east-1"

  # Complex conditional
  instance_type = (
    var.environment == "prod" ? "t2.large" :
    var.environment == "staging" ? "t2.medium" :
    "t2.micro"
  )

  # Splat Expression (get attribute from all items)
  instance_ids = aws_instance.web[*].id

  # For Expression - List
  uppercase_names = [for name in var.names : upper(name)]

  # For Expression - Map
  tag_map = {
    for key, value in var.tags :
    upper(key) => lower(value)
  }

  # For Expression with condition
  prod_instances = [
    for instance in var.instances :
    instance.id
    if instance.environment == "prod"
  ]

  # For Expression with index
  indexed_names = {
    for idx, name in var.names :
    idx => name
  }
}
```

---

## Conditionals & Loops

```hcl
# Count (create multiple resources)
resource "aws_instance" "web" {
  count = var.instance_count

  ami           = "ami-abc123"
  instance_type = "t2.micro"

  tags = {
    Name = "web-server-${count.index}"
  }
}

# Conditional resource creation
resource "aws_instance" "bastion" {
  count = var.create_bastion ? 1 : 0

  ami           = "ami-abc123"
  instance_type = "t2.micro"
}

# For_each with set
resource "aws_s3_bucket" "logs" {
  for_each = toset(var.bucket_names)

  bucket = each.value

  tags = {
    Name = each.value
  }
}

# For_each with map
resource "aws_iam_user" "developers" {
  for_each = var.developers

  name = each.key

  tags = {
    Team  = each.value.team
    Level = each.value.level
  }
}

# Dynamic blocks (nested repeating blocks)
resource "aws_security_group" "web" {
  name = "web-sg"

  dynamic "ingress" {
    for_each = var.ingress_rules

    content {
      from_port   = ingress.value.from_port
      to_port     = ingress.value.to_port
      protocol    = ingress.value.protocol
      cidr_blocks = ingress.value.cidr_blocks
    }
  }
}

# Dynamic block with condition
resource "aws_instance" "web" {
  ami           = "ami-abc123"
  instance_type = "t2.micro"

  dynamic "ebs_block_device" {
    for_each = var.enable_extra_storage ? [1] : []

    content {
      device_name = "/dev/sdf"
      volume_size = 100
    }
  }
}

# Conditional expressions in locals
locals {
  # Simple conditional
  env = var.environment == "prod" ? "production" : "development"

  # Nested conditionals
  instance_type = (
    var.tier == "premium" ? "t2.xlarge" :
    var.tier == "standard" ? "t2.large" :
    "t2.micro"
  )

  # Conditional list
  security_groups = concat(
    var.base_security_groups,
    var.enable_ssh ? ["sg-ssh-access"] : []
  )

  # Conditional map merge
  tags = merge(
    var.common_tags,
    var.environment == "prod" ? {
      Backup       = "true"
      Compliance   = "required"
    } : {}
  )
}
```

---

## Numeric Functions

```hcl
locals {
  # abs - Returns absolute value
  absolute = abs(-5)                    # Result: 5
  abs_float = abs(-3.14)                # Result: 3.14

  # ceil - Rounds up to nearest integer
  ceiling = ceil(3.2)                   # Result: 4
  ceil_negative = ceil(-3.2)            # Result: -3

  # floor - Rounds down to nearest integer
  floored = floor(3.8)                  # Result: 3
  floor_negative = floor(-3.8)          # Result: -4

  # log - Natural logarithm
  logarithm = log(2.718281828459045)    # Result: ~1

  # max - Returns largest value
  maximum = max(5, 12, 9, 3)            # Result: 12
  max_negative = max(-1, -5, -3)        # Result: -1

  # min - Returns smallest value
  minimum = min(5, 12, 9, 3)            # Result: 3
  min_negative = min(-1, -5, -3)        # Result: -5

  # parseint - Parse string as integer
  parsed_int = parseint("100", 10)      # Result: 100 (base 10)
  parsed_hex = parseint("FF", 16)       # Result: 255 (base 16)
  parsed_binary = parseint("1010", 2)   # Result: 10 (base 2)

  # pow - Raises number to power
  power = pow(2, 8)                     # Result: 256
  power_float = pow(3, 0.5)             # Result: 1.732... (square root)

  # signum - Returns sign of number
  sign_positive = signum(42)            # Result: 1
  sign_negative = signum(-10)           # Result: -1
  sign_zero = signum(0)                 # Result: 0
}

# Example: Calculate instance storage size
locals {
  base_storage_gb = 10
  storage_multiplier = 2.5

  # 10 * 2.5 = 25.0, ceil() rounds up
  total_storage = ceil(base_storage_gb * storage_multiplier)  # Result: 25

  # Ensure minimum storage (max of 25 and 20)
  final_storage = max(total_storage, 20)  # Result: 25 (at least 20 GB)
}
```

---

## String Functions

```hcl
locals {
  # chomp - Removes newline characters from end
  chomped = chomp("hello\n")            # Result: "hello"

  # endswith - Checks if string ends with suffix
  has_suffix = endswith("hello.txt", ".txt")  # Result: true

  # format - Printf-style formatting
  formatted = format("Hello, %s!", "World")           # Result: "Hello, World!"
  formatted_num = format("Number: %d", 42)            # Result: "Number: 42"
  formatted_float = format("Price: %.2f", 19.99)      # Result: "Price: 19.99"
  padded = format("%05d", 42)                         # Result: "00042"

  # formatlist - Formats each element in list
  servers = ["web1", "web2", "web3"]
  fqdns = formatlist("server-%s.example.com", servers)
  # Result: ["server-web1.example.com", "server-web2.example.com", "server-web3.example.com"]

  # indent - Adds spaces to beginning of each line
  indented = indent(4, "line1\nline2")  # Result: "    line1\n    line2"

  # join - Joins list elements into string
  joined = join(", ", ["apple", "banana", "orange"])  # Result: "apple, banana, orange"
  path = join("/", ["var", "www", "html"])            # Result: "var/www/html"

  # lower - Converts to lowercase
  lowercase = lower("HELLO WORLD")      # Result: "hello world"

  # upper - Converts to uppercase
  uppercase = upper("hello world")      # Result: "HELLO WORLD"

  # regex - Matches regular expression
  has_match = regex("[0-9]+", "abc123def")  # Result: "123"

  # regexall - Returns all matches
  all_numbers = regexall("[0-9]+", "abc123def456")  # Result: ["123", "456"]

  # replace - Replaces substring
  replaced = replace("hello world", "world", "terraform")  # Result: "hello terraform"

  # split - Splits string into list
  split_csv = split(",", "apple,banana,orange")     # Result: ["apple", "banana", "orange"]
  split_path = split("/", "var/www/html")           # Result: ["var", "www", "html"]

  # startswith - Checks if string starts with prefix
  has_prefix = startswith("hello.txt", "hello")     # Result: true

  # strrev - Reverses string
  reversed = strrev("hello")            # Result: "olleh"

  # substr - Extracts substring
  substring = substr("hello world", 0, 5)           # Result: "hello"
  substr_offset = substr("hello world", 6, 5)       # Result: "world"

  # title - Capitalizes first letter of each word
  titled = title("hello world")         # Result: "Hello World"

  # trim - Removes specified characters from both ends
  trimmed = trim("  hello  ", " ")      # Result: "hello"
  trim_slashes = trim("//hello//", "/") # Result: "hello"

  # trimprefix - Removes prefix if present
  no_prefix = trimprefix("https://example.com", "https://")  # Result: "example.com"

  # trimsuffix - Removes suffix if present
  no_suffix = trimsuffix("file.txt", ".txt")        # Result: "file"

  # trimspace - Removes whitespace from both ends
  trimmed_space = trimspace("  hello world  ")     # Result: "hello world"
}

# Example: Resource naming
locals {
  project = "myapp"
  environment = "prod"
  region = "us-east-1"

  # Build resource name with prefix
  # Joins ["myapp", "prod"] with "-" then converts to lowercase
  resource_prefix = lower(join("-", [local.project, local.environment]))
  # Result: "myapp-prod"

  # Create fully qualified name using printf-style formatting
  instance_name = format("%s-%s-instance", local.resource_prefix, local.region)
  # Result: "myapp-prod-us-east-1-instance"

  # Extract environment from tag by removing prefix
  tag_value = "Environment:Production"
  environment_name = trimprefix(tag_value, "Environment:")
  # Result: "Production" (prefix "Environment:" removed)
}
```

---

## Collection Functions

```hcl
locals {
  # alltrue - Returns true if all elements are true
  all_enabled = alltrue([true, true, true])         # Result: true
  some_disabled = alltrue([true, false, true])      # Result: false

  # anytrue - Returns true if any element is true
  any_enabled = anytrue([false, true, false])       # Result: true
  none_enabled = anytrue([false, false, false])     # Result: false

  # chunklist - Splits list into fixed-size chunks
  numbers = [1, 2, 3, 4, 5, 6, 7, 8]
  chunks = chunklist(numbers, 3)
  # Result: [[1, 2, 3], [4, 5, 6], [7, 8]]

  # coalesce - Returns first non-null value
  first_valid = coalesce(null, null, "default", "backup")  # Result: "default"

  # coalescelist - Returns first non-empty list
  first_list = coalescelist([], [], ["a", "b"], ["c"])     # Result: ["a", "b"]

  # compact - Removes empty strings from list
  with_empty = ["a", "", "b", "", "c"]
  cleaned = compact(with_empty)         # Result: ["a", "b", "c"]

  # concat - Concatenates multiple lists
  list1 = ["a", "b"]
  list2 = ["c", "d"]
  combined = concat(list1, list2)       # Result: ["a", "b", "c", "d"]

  # contains - Checks if list contains value
  has_value = contains(["a", "b", "c"], "b")        # Result: true
  missing_value = contains(["a", "b", "c"], "z")    # Result: false

  # distinct - Removes duplicate values
  with_dupes = ["a", "b", "a", "c", "b"]
  unique = distinct(with_dupes)         # Result: ["a", "b", "c"]

  # element - Returns element at index (wraps around)
  items = ["a", "b", "c"]
  first = element(items, 0)             # Result: "a"
  wrapped = element(items, 5)           # Result: "c" (5 % 3 = 2)

  # flatten - Flattens nested lists
  nested = [[1, 2], [3, 4], [5]]
  flat = flatten(nested)                # Result: [1, 2, 3, 4, 5]

  # index - Returns index of value in list
  position = index(["a", "b", "c"], "b")            # Result: 1

  # keys - Returns map keys as list
  my_map = {name = "John", age = "30", city = "NYC"}
  map_keys = keys(my_map)               # Result: ["age", "city", "name"] (sorted)

  # length - Returns length of collection
  list_length = length(["a", "b", "c"])             # Result: 3
  map_length = length({a = 1, b = 2})               # Result: 2
  string_length = length("hello")                   # Result: 5

  # lookup - Gets map value by key with default
  config = {env = "prod", region = "us-east-1"}
  region = lookup(config, "region", "us-west-2")    # Result: "us-east-1"
  missing = lookup(config, "tier", "standard")      # Result: "standard"

  # matchkeys - Returns values from list where keys match
  servers = ["web1", "web2", "db1"]
  types = ["web", "web", "db"]
  web_servers = matchkeys(servers, types, ["web"])  # Result: ["web1", "web2"]

  # merge - Merges multiple maps
  map1 = {a = 1, b = 2}
  map2 = {c = 3, d = 4}
  map3 = {b = 5}  # Overwrites b from map1
  merged = merge(map1, map2, map3)      # Result: {a=1, b=5, c=3, d=4}

  # one - Returns single element or null
  single_item = one(["only"])           # Result: "only"
  empty_result = one([])                # Result: null
  # multiple_items = one(["a", "b"])    # ERROR: must have exactly 0 or 1 elements

  # range - Generates numeric sequence
  sequence = range(5)                   # Result: [0, 1, 2, 3, 4]
  custom_range = range(2, 8)            # Result: [2, 3, 4, 5, 6, 7]
  with_step = range(0, 10, 2)           # Result: [0, 2, 4, 6, 8]

  # reverse - Reverses list
  original = ["a", "b", "c"]
  reversed_list = reverse(original)     # Result: ["c", "b", "a"]

  # setintersection - Returns common elements
  set1 = ["a", "b", "c"]
  set2 = ["b", "c", "d"]
  common = setintersection(set1, set2)  # Result: ["b", "c"]

  # setproduct - Cartesian product of sets
  colors = ["red", "blue"]
  sizes = ["S", "M"]
  combinations = setproduct(colors, sizes)
  # Result: [["red", "S"], ["red", "M"], ["blue", "S"], ["blue", "M"]]

  # setsubtract - Removes elements from first set
  all_items = ["a", "b", "c", "d"]
  to_remove = ["b", "d"]
  remaining = setsubtract(all_items, to_remove)     # Result: ["a", "c"]

  # setunion - Combines sets (unique values)
  union = setunion(["a", "b"], ["b", "c"])          # Result: ["a", "b", "c"]

  # slice - Extracts portion of list
  full_list = ["a", "b", "c", "d", "e"]
  portion = slice(full_list, 1, 4)      # Result: ["b", "c", "d"]

  # sort - Sorts list alphabetically
  unsorted = ["c", "a", "d", "b"]
  sorted_list = sort(unsorted)          # Result: ["a", "b", "c", "d"]

  # sum - Sums numeric list
  numbers_list = [1, 2, 3, 4, 5]
  total = sum(numbers_list)             # Result: 15

  # transpose - Transposes map of lists
  original_map = {
    "a" = ["1", "2"]
    "b" = ["2", "3"]
  }
  transposed = transpose(original_map)
  # Result: {"1" = ["a"], "2" = ["a", "b"], "3" = ["b"]}

  # values - Returns map values as list
  value_list = values({a = 1, b = 2, c = 3})        # Result: [1, 2, 3]

  # zipmap - Creates map from two lists
  keys_list = ["name", "age", "city"]
  values_list = ["John", "30", "NYC"]
  zipped = zipmap(keys_list, values_list)
  # Result: {name = "John", age = "30", city = "NYC"}
}

# Example: Dynamic security group rules
locals {
  ports = [80, 443, 8080]
  protocols = ["tcp", "tcp", "tcp"]

  # Create ingress rules from lists using for expression
  ingress_rules = [
    for idx, port in local.ports : {
      from_port   = port
      to_port     = port
      protocol    = local.protocols[idx]
      cidr_blocks = ["0.0.0.0/0"]
    }
  ]
  # Result: [
  #   {from_port = 80, to_port = 80, protocol = "tcp", cidr_blocks = ["0.0.0.0/0"]},
  #   {from_port = 443, to_port = 443, protocol = "tcp", cidr_blocks = ["0.0.0.0/0"]},
  #   {from_port = 8080, to_port = 8080, protocol = "tcp", cidr_blocks = ["0.0.0.0/0"]}
  # ]
}
```

---

## Encoding Functions

```hcl
locals {
  # base64encode - Encodes string to base64
  encoded = base64encode("Hello, World!")
  # Result: "SGVsbG8sIFdvcmxkIQ=="

  # base64decode - Decodes base64 string
  decoded = base64decode("SGVsbG8sIFdvcmxkIQ==")
  # Result: "Hello, World!"

  # base64gzip - Compresses and encodes to base64
  compressed = base64gzip("This is a long string that will be compressed")
  # Result: "H4sIAAAAAAAA/..." (gzip-compressed data encoded in base64)

  # csvdecode - Parses CSV into list of maps
  csv_data = <<-EOF
    name,age,city
    Alice,30,NYC
    Bob,25,LA
  EOF

  parsed_csv = csvdecode(csv_data)
  # Result: [
  #   {name = "Alice", age = "30", city = "NYC"},
  #   {name = "Bob", age = "25", city = "LA"}
  # ]

  # jsondecode - Parses JSON string
  json_string = "{\"name\": \"John\", \"age\": 30}"
  parsed_json = jsondecode(json_string)
  # Result: {name = "John", age = 30}

  # jsonencode - Converts value to JSON
  data = {
    name    = "Alice"
    age     = 30
    active  = true
    tags    = ["admin", "user"]
  }
  json_output = jsonencode(data)
  # Result: '{"active":true,"age":30,"name":"Alice","tags":["admin","user"]}'

  # textencodebase64 - Encodes with character encoding
  utf8_encoded = textencodebase64("Hello 世界", "UTF-8")

  # textdecodebase64 - Decodes with character encoding
  utf8_decoded = textdecodebase64(utf8_encoded, "UTF-8")

  # urlencode - URL encodes string
  url_safe = urlencode("hello world & special=chars")
  # Result: "hello+world+%26+special%3Dchars"

  # yamldecode - Parses YAML string
  yaml_string = <<-EOF
    name: John
    age: 30
    tags:
      - admin
      - user
  EOF

  parsed_yaml = yamldecode(yaml_string)
  # Result: {name = "John", age = 30, tags = ["admin", "user"]}

  # yamlencode - Converts value to YAML
  yaml_output = yamlencode({
    name = "Alice"
    age  = 30
    tags = ["admin", "user"]
  })
  # Result: |
  #   "age": 30
  #   "name": "Alice"
  #   "tags":
  #   - "admin"
  #   - "user"
}

# Example: User data script encoding
resource "aws_instance" "web" {
  ami           = "ami-abc123"
  instance_type = "t2.micro"

  # Base64 encode user data (required by AWS)
  # 1. templatefile() reads and renders the template with variables
  # 2. base64encode() converts the rendered script to base64
  user_data = base64encode(templatefile("${path.module}/user-data.sh", {
    hostname = "web-server"
    region   = var.region
  }))
  # Result: "IyEvYmluL2Jhc2g..." (base64-encoded user data script)
}

# Example: Config from JSON
locals {
  # Read JSON file as string
  config_json = file("${path.module}/config.json")
  # Result: '{"database": {"host": "db.example.com", "port": 5432}}'

  # Parse JSON string into HCL object
  config = jsondecode(local.config_json)
  # Result: {database = {host = "db.example.com", port = 5432}}

  # Access parsed values using dot notation
  database_host = local.config.database.host  # Result: "db.example.com"
  database_port = local.config.database.port  # Result: 5432
}
```

---

## Filesystem Functions

```hcl
locals {
  # abspath - Converts relative path to absolute
  absolute_path = abspath("./modules/vpc")
  # Result: "/home/user/terraform/modules/vpc"

  # basename - Returns filename from path
  filename = basename("/path/to/file.txt")          # Result: "file.txt"
  dir_name = basename("/path/to/directory/")        # Result: "directory"

  # dirname - Returns directory portion of path
  directory = dirname("/path/to/file.txt")          # Result: "/path/to"

  # file - Reads file content as string
  config_file = file("${path.module}/config.txt")
  # Result: "database=postgres\nport=5432\n..." (entire file content as string)

  # fileexists - Checks if file exists
  has_config = fileexists("${path.module}/config.txt")
  # Result: true (if file exists) or false (if file doesn't exist)

  # fileset - Lists files matching pattern
  template_files = fileset(path.module, "templates/*.tpl")
  # Result: ["templates/app.tpl", "templates/web.tpl"]

  all_tf_files = fileset(path.module, "**/*.tf")
  # Result: ["main.tf", "variables.tf", "modules/vpc/main.tf", ...]

  # filebase64 - Reads file as base64
  encoded_file = filebase64("${path.module}/image.png")
  # Result: "iVBORw0KGgoAAAANSUhEUgAA..." (base64-encoded file content)

  # filebase64sha256 - Returns base64-encoded SHA256 hash
  file_hash = filebase64sha256("${path.module}/lambda.zip")
  # Result: "n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg=" (used for Lambda versioning)

  # filebase64sha512 - Returns base64-encoded SHA512 hash
  file_hash_512 = filebase64sha512("${path.module}/data.bin")
  # Result: "MJ7MSJwS1utMxA9QyQLytNDtd+..." (base64-encoded SHA512 hash)

  # filemd5 - Returns MD5 hash of file
  file_md5 = filemd5("${path.module}/script.sh")
  # Result: "d41d8cd98f00b204e9800998ecf8427e" (32-character hex MD5 hash)

  # filesha1 - Returns SHA1 hash of file
  file_sha1 = filesha1("${path.module}/archive.tar")
  # Result: "da39a3ee5e6b4b0d3255bfef95601890afd80709" (40-character hex SHA1 hash)

  # filesha256 - Returns SHA256 hash of file
  file_sha256 = filesha256("${path.module}/binary")
  # Result: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" (64-char hex)

  # filesha512 - Returns SHA512 hash of file
  file_sha512 = filesha512("${path.module}/package.zip")
  # Result: "cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce..." (128-char hex)

  # pathexpand - Expands ~ to home directory
  home_path = pathexpand("~/.ssh/id_rsa")
  # Result: "/home/username/.ssh/id_rsa"

  # templatefile - Renders template file with variables
  user_data = templatefile("${path.module}/user-data.tpl", {
    hostname    = "web-server"
    environment = var.environment
    ports       = [80, 443]
  })
  # Result: Rendered template with variables substituted
  # If template contains: "hostname = ${hostname}, env = ${environment}"
  # Result: "hostname = web-server, env = production"
}

# Path References
locals {
  # path.module - Path to current module
  module_path = path.module
  # Result: "./modules/vpc" or "." for root

  # path.root - Path to root module
  root_path = path.root
  # Result: "."

  # path.cwd - Current working directory
  current_dir = path.cwd
  # Result: "/home/user/terraform"
}

# Example: Load multiple template files
locals {
  # Get all template files matching pattern
  templates = fileset(path.module, "templates/*.tpl")
  # Result: ["templates/app.tpl", "templates/web.tpl", "templates/db.tpl"]

  # Render each template with variables
  rendered_templates = {
    for template in local.templates :
    template => templatefile("${path.module}/${template}", {
      environment = var.environment
      region      = var.region
    })
  }
  # Result: {
  #   "templates/app.tpl" = "rendered content of app.tpl...",
  #   "templates/web.tpl" = "rendered content of web.tpl...",
  #   "templates/db.tpl" = "rendered content of db.tpl..."
  # }
}

# Example: Lambda function deployment
resource "aws_lambda_function" "api" {
  filename         = "${path.module}/lambda.zip"
  function_name    = "api-function"
  role            = aws_iam_role.lambda.arn
  handler         = "index.handler"
  # Compute hash of zip file - Lambda redeploys when hash changes
  source_code_hash = filebase64sha256("${path.module}/lambda.zip")
  # Result: "n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg="
  runtime         = "nodejs18.x"
}

# Example: Conditional file inclusion
locals {
  # Check if custom config exists, use it; otherwise use default
  config = fileexists("${path.module}/custom-config.json") ? (
    jsondecode(file("${path.module}/custom-config.json"))
  ) : (
    jsondecode(file("${path.module}/default-config.json"))
  )
  # Result: HCL object from whichever config file exists
  # Example: {database = {host = "localhost", port = 5432}, app = {name = "myapp"}}
}
```

---

## Date & Time Functions

```hcl
locals {
  # formatdate - Formats timestamp
  current_time = timestamp()

  # Format examples
  date_iso = formatdate("YYYY-MM-DD", local.current_time)
  # Result: "2024-11-18"

  date_us = formatdate("MM/DD/YYYY", local.current_time)
  # Result: "11/18/2024"

  datetime_full = formatdate("YYYY-MM-DD hh:mm:ss", local.current_time)
  # Result: "2024-11-18 14:30:45"

  datetime_12h = formatdate("DD MMM YYYY hh:mm:ss AA", local.current_time)
  # Result: "18 Nov 2024 02:30:45 PM"

  time_only = formatdate("hh:mm:ss", local.current_time)
  # Result: "14:30:45"

  custom_format = formatdate("EEE, DD MMM YYYY hh:mm:ss ZZZ", local.current_time)
  # Result: "Mon, 18 Nov 2024 14:30:45 UTC"

  # timestamp - Current timestamp in UTC
  now = timestamp()
  # Result: "2024-11-18T14:30:45Z"

  # timeadd - Add duration to timestamp
  tomorrow = timeadd(timestamp(), "24h")
  # Result: "2024-11-19T14:30:45Z" (24 hours from current timestamp)

  next_week = timeadd(timestamp(), "168h")
  # Result: "2024-11-25T14:30:45Z" (7 days = 168 hours)

  next_month = timeadd(timestamp(), "720h")
  # Result: "2024-12-18T14:30:45Z" (30 days = 720 hours)

  future_time = timeadd(timestamp(), "1h30m")
  # Result: "2024-11-18T16:00:45Z" (1 hour 30 minutes from now)

  # timecmp - Compare two timestamps
  is_after = timecmp("2024-11-18T15:00:00Z", "2024-11-18T14:00:00Z")
  # Result: 1 (first is later)

  is_before = timecmp("2024-11-18T13:00:00Z", "2024-11-18T14:00:00Z")
  # Result: -1 (first is earlier)

  is_equal = timecmp("2024-11-18T14:00:00Z", "2024-11-18T14:00:00Z")
  # Result: 0 (equal)

  # plantimestamp - Consistent timestamp for apply
  # Unlike timestamp(), this remains constant during planning/applying
  plan_time = plantimestamp()
  # Result: "2024-11-18T14:30:45Z" (same value throughout terraform apply)
}

# Format Date Specification
# YYYY - 4-digit year (2024)
# YY   - 2-digit year (24)
# MMMM - Full month name (November)
# MMM  - Short month name (Nov)
# MM   - 2-digit month (11)
# M    - Month (11)
# DD   - 2-digit day (18)
# D    - Day (18)
# EEEE - Full day name (Monday)
# EEE  - Short day name (Mon)
# hh   - 2-digit hour (14)
# h    - Hour (14)
# mm   - 2-digit minute (05)
# m    - Minute (5)
# ss   - 2-digit second (09)
# s    - Second (9)
# AA   - AM/PM
# ZZZ  - Timezone (UTC)
# ZZZZ - Timezone offset (+00:00)

# Example: Resource expiration
locals {
  created_at = timestamp()
  # Result: "2024-11-18T14:30:45Z"

  expires_at = timeadd(local.created_at, "720h")  # 30 days
  # Result: "2024-12-18T14:30:45Z"

  # Check if current time is after expiration time
  is_expired = timecmp(timestamp(), local.expires_at) > 0
  # Result: false (not expired) or true (expired)
}

# Example: Time-based tagging
resource "aws_instance" "web" {
  ami           = "ami-abc123"
  instance_type = "t2.micro"

  tags = {
    Name      = "web-server"
    # Format current time for display
    CreatedAt = formatdate("YYYY-MM-DD hh:mm:ss", plantimestamp())
    # Result: "2024-11-18 14:30:45"

    # Calculate and format expiration date (30 days from now)
    ExpiresAt = formatdate("YYYY-MM-DD", timeadd(plantimestamp(), "720h"))
    # Result: "2024-12-18"
  }
}

# Example: Backup rotation
locals {
  # Create timestamp string for backup naming
  backup_timestamp = formatdate("YYYY-MM-DD-hhmm", plantimestamp())
  # Result: "2024-11-18-1430"

  backup_name = "backup-${local.backup_timestamp}"
  # Result: "backup-2024-11-18-1430"
}
```

---

## Hash & Crypto Functions

```hcl
locals {
  # bcrypt - Generates bcrypt hash (for passwords)
  password_hash = bcrypt("my-secret-password")
  # Result: "$2a$10$..." (different each time due to salt)

  # md5 - Generates MD5 hash (128-bit)
  md5_hash = md5("Hello, World!")
  # Result: "65a8e27d8879283831b664bd8b7f0ad4"

  # sha1 - Generates SHA1 hash (160-bit)
  sha1_hash = sha1("Hello, World!")
  # Result: "0a0a9f2a6772942557ab5355d76af442f8f65e01"

  # sha256 - Generates SHA256 hash (256-bit)
  sha256_hash = sha256("Hello, World!")
  # Result: "dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f"

  # sha512 - Generates SHA512 hash (512-bit)
  sha512_hash = sha512("Hello, World!")
  # Result: "374d794a95cdcfd8b35993185fef9ba368f160d8daf432d08ba9f1ed1e5abe6c..."

  # base64sha256 - SHA256 hash encoded as base64
  base64_sha256 = base64sha256("Hello, World!")
  # Result: "3/1gIbsr1bCvZ2KQgJ7DpTGR3YHH9wpLKGiKNiGCmG8="

  # base64sha512 - SHA512 hash encoded as base64
  base64_sha512 = base64sha512("Hello, World!")
  # Result: "N015SpXNz9izWZMYX++bo2jxYNja9DLQi6nx7R5avm..."

  # rsadecrypt - Decrypts RSA-encrypted data
  # private_key = file("${path.module}/private-key.pem")
  # decrypted = rsadecrypt(encrypted_data, private_key)

  # uuid - Generates random UUID
  random_id = uuid()
  # Result: "e7a4f8c9-1234-5678-9abc-def012345678"
  # WARNING: Generates NEW UUID on each plan - not recommended for resources!

  # uuidv5 - Generates deterministic UUID v5 (preferred for resources)
  namespace = "6ba7b810-9dad-11d1-80b4-00c04fd430c8"  # DNS namespace (standard)
  deterministic_uuid = uuidv5(namespace, "example.com")
  # Result: "cfbff0d1-9375-5685-968c-48ce8b15ae17" (always same for same inputs)
}

# Example: Content-based versioning
resource "aws_s3_object" "config" {
  bucket = aws_s3_bucket.app.id
  key    = "config.json"
  source = "${path.module}/config.json"

  # ETag based on content hash - S3 updates object when hash changes
  etag = md5(file("${path.module}/config.json"))
  # Result: "5d41402abc4b2a76b9719d911017c592" (MD5 hash of file content)
}

# Example: Lambda versioning with hash
resource "aws_lambda_function" "api" {
  filename         = "${path.module}/lambda.zip"
  function_name    = "api-function"
  role            = aws_iam_role.lambda.arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"

  # Trigger update when code changes - Lambda redeploys on hash change
  source_code_hash = base64sha256(file("${path.module}/lambda.zip"))
  # Result: "RBNvo1WzZ4oRRq0W9+hknpT7T8If536DEMBg9hyq/4o="
}

# Example: Unique resource naming
locals {
  # Create unique but deterministic names using UUID v5
  namespace_uuid = "6ba7b810-9dad-11d1-80b4-00c04fd430c8"

  # Generate deterministic UUID from project and environment
  bucket_uuid = uuidv5(local.namespace_uuid, "${var.project}-${var.environment}")
  # Result: "a1b2c3d4-5678-5901-2345-6789abcdef01"

  # Use first 8 characters of UUID for short unique identifier
  bucket_name = "data-${substr(local.bucket_uuid, 0, 8)}"
  # Result: "data-a1b2c3d4" (always same for same project+environment)
}

# Example: Secret hashing
locals {
  # Hash API keys for comparison (not for storage!)
  api_key_hash = sha256(var.api_key)
  # Result: "9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca7"

  # Generate password hash (includes salt, different each time)
  user_password = bcrypt(var.user_password)
  # Result: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
}
```

---

## IP Network Functions

```hcl
locals {
  # cidrhost - Gets IP address from CIDR block
  first_ip = cidrhost("10.0.0.0/24", 0)             # Result: "10.0.0.0"
  second_ip = cidrhost("10.0.0.0/24", 1)            # Result: "10.0.0.1"
  tenth_ip = cidrhost("10.0.0.0/24", 10)            # Result: "10.0.0.10"
  last_ip = cidrhost("10.0.0.0/24", 255)            # Result: "10.0.0.255"

  # cidrnetmask - Gets netmask from CIDR
  netmask_24 = cidrnetmask("10.0.0.0/24")           # Result: "255.255.255.0"
  netmask_16 = cidrnetmask("10.0.0.0/16")           # Result: "255.255.0.0"
  netmask_8 = cidrnetmask("10.0.0.0/8")             # Result: "255.0.0.0"

  # cidrsubnet - Creates subnet from network
  # cidrsubnet(prefix, newbits, netnum)

  # Split /16 into /24 subnets
  subnet_0 = cidrsubnet("10.0.0.0/16", 8, 0)        # Result: "10.0.0.0/24"
  subnet_1 = cidrsubnet("10.0.0.0/16", 8, 1)        # Result: "10.0.1.0/24"
  subnet_2 = cidrsubnet("10.0.0.0/16", 8, 2)        # Result: "10.0.2.0/24"

  # Split /16 into /20 subnets
  large_subnet_0 = cidrsubnet("10.0.0.0/16", 4, 0)  # Result: "10.0.0.0/20"
  large_subnet_1 = cidrsubnet("10.0.0.0/16", 4, 1)  # Result: "10.0.16.0/20"

  # cidrsubnets - Creates multiple subnets at once
  # cidrsubnets(prefix, newbits...)

  # Create subnets of different sizes
  vpc_subnets = cidrsubnets("10.0.0.0/16", 4, 4, 8, 8)
  # Result: [
  #   "10.0.0.0/20",    # +4 bits = /20
  #   "10.0.16.0/20",   # +4 bits = /20
  #   "10.0.32.0/24",   # +8 bits = /24
  #   "10.0.33.0/24"    # +8 bits = /24
  # ]
}

# Example: VPC subnet creation
locals {
  vpc_cidr = "10.0.0.0/16"

  # Create 3 public subnets (/20 = 4096 IPs each)
  # Formula: /16 + 4 bits = /20, index determines which subnet
  public_subnets = [
    cidrsubnet(local.vpc_cidr, 4, 0),   # Result: "10.0.0.0/20"
    cidrsubnet(local.vpc_cidr, 4, 1),   # Result: "10.0.16.0/20"
    cidrsubnet(local.vpc_cidr, 4, 2),   # Result: "10.0.32.0/20"
  ]

  # Create 3 private subnets (/20)
  private_subnets = [
    cidrsubnet(local.vpc_cidr, 4, 3),   # Result: "10.0.48.0/20"
    cidrsubnet(local.vpc_cidr, 4, 4),   # Result: "10.0.64.0/20"
    cidrsubnet(local.vpc_cidr, 4, 5),   # Result: "10.0.80.0/20"
  ]

  # Create database subnets (/24 = 256 IPs each)
  # Formula: /16 + 8 bits = /24
  database_subnets = [
    cidrsubnet(local.vpc_cidr, 8, 96),  # Result: "10.0.96.0/24"
    cidrsubnet(local.vpc_cidr, 8, 97),  # Result: "10.0.97.0/24"
    cidrsubnet(local.vpc_cidr, 8, 98),  # Result: "10.0.98.0/24"
  ]
}

# Example: Dynamic subnet allocation
locals {
  availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]

  # Automatically create subnet for each AZ using for expression
  az_subnets = {
    for idx, az in local.availability_zones :
    az => cidrsubnet("10.0.0.0/16", 8, idx)
  }
  # Result: Map of availability zone to subnet CIDR
  # {
  #   "us-east-1a" = "10.0.0.0/24"
  #   "us-east-1b" = "10.0.1.0/24"
  #   "us-east-1c" = "10.0.2.0/24"
  # }
}

# Example: Reserve IPs for services
locals {
  subnet_cidr = "10.0.1.0/24"

  # Reserve first 10 IPs for infrastructure
  gateway_ip = cidrhost(local.subnet_cidr, 1)       # Result: "10.0.1.1"
  dns_ip_1 = cidrhost(local.subnet_cidr, 2)         # Result: "10.0.1.2"
  dns_ip_2 = cidrhost(local.subnet_cidr, 3)         # Result: "10.0.1.3"

  # Generate application IPs starting from host 10
  app_ips = [
    for i in range(10, 20) :
    cidrhost(local.subnet_cidr, i)
  ]
  # Result: List of 10 consecutive IPs
  # ["10.0.1.10", "10.0.1.11", "10.0.1.12", ..., "10.0.1.19"]
}

# Example: Multi-tier network
locals {
  vpc_cidr = "10.0.0.0/16"

  # Use cidrsubnets for automatic allocation (no overlaps)
  all_subnets = cidrsubnets(
    local.vpc_cidr,
    4, 4, 4,  # 3 public subnets (/20)
    4, 4, 4,  # 3 private subnets (/20)
    8, 8, 8   # 3 database subnets (/24)
  )
  # Result: List of 9 non-overlapping subnet CIDRs
  # ["10.0.0.0/20", "10.0.16.0/20", "10.0.32.0/20",
  #  "10.0.48.0/20", "10.0.64.0/20", "10.0.80.0/20",
  #  "10.0.96.0/24", "10.0.97.0/24", "10.0.98.0/24"]

  # Extract subnets by tier using slice
  public_subnet_cidrs = slice(local.all_subnets, 0, 3)
  # Result: ["10.0.0.0/20", "10.0.16.0/20", "10.0.32.0/20"]

  private_subnet_cidrs = slice(local.all_subnets, 3, 6)
  # Result: ["10.0.48.0/20", "10.0.64.0/20", "10.0.80.0/20"]

  database_subnet_cidrs = slice(local.all_subnets, 6, 9)
  # Result: ["10.0.96.0/24", "10.0.97.0/24", "10.0.98.0/24"]
}
```

---

## Type Conversion Functions

```hcl
locals {
  # can - Tests if expression is valid
  can_parse = can(parseint("123", 10))              # Result: true
  can_parse_invalid = can(parseint("abc", 10))      # Result: false

  can_access = can(var.config.database.host)        # true if path exists

  # tobool - Converts to boolean
  bool_true = tobool("true")                        # Result: true
  bool_false = tobool("false")                      # Result: false
  bool_1 = tobool(1)                                # Result: true
  bool_0 = tobool(0)                                # Result: false

  # tolist - Converts to list
  from_set = tolist(toset(["a", "b", "c"]))         # Result: ["a", "b", "c"]
  from_tuple = tolist(["a", 1, true])               # Result: ["a", 1, true]

  # tomap - Converts to map
  converted_map = tomap({
    "key1" = "value1"
    "key2" = "value2"
  })

  # tonumber - Converts to number
  num_from_string = tonumber("42")                  # Result: 42
  num_from_float = tonumber("3.14")                 # Result: 3.14
  num_from_bool = tonumber(true)                    # Result: 1

  # toset - Converts to set (removes duplicates)
  unique_values = toset(["a", "b", "a", "c", "b"])  # Result: ["a", "b", "c"]

  # tostring - Converts to string
  str_from_num = tostring(42)                       # Result: "42"
  str_from_bool = tostring(true)                    # Result: "true"

  # try - Returns first valid expression
  safe_value = try(var.optional_value, "default")

  nested_value = try(
    var.config.database.host,
    var.fallback_host,
    "localhost"
  )

  # type - Returns type of value
  type_string = type("hello")                       # Result: "string"
  type_number = type(42)                            # Result: "number"
  type_bool = type(true)                            # Result: "bool"
  type_list = type(["a", "b"])                      # Result: "list"
  type_map = type({a = 1})                          # Result: "map"
  type_object = type({a = 1, b = "text"})           # Result: "object"
}

# Example: Safe variable access
locals {
  # Use try to handle missing values - returns first successful expression
  database_host = try(var.database_config.host, "localhost")
  # Result: var.database_config.host if it exists, otherwise "localhost"

  database_port = try(var.database_config.port, 5432)
  # Result: var.database_config.port if it exists, otherwise 5432

  # Use can to check if value is valid (returns true/false)
  has_valid_config = can(var.database_config.host)
  # Result: true if var.database_config.host exists and is valid, false otherwise

  # Combine can with ternary for conditional logic
  connection_string = can(var.database_config.host) ? (
    "${var.database_config.host}:${var.database_config.port}"
  ) : "localhost:5432"
  # Result: "db.example.com:5432" if config exists, otherwise "localhost:5432"
}

# Example: Type validation
variable "instance_count" {
  type = number

  validation {
    condition     = can(tonumber(var.instance_count))
    error_message = "Instance count must be a valid number."
  }

  validation {
    condition     = var.instance_count > 0 && var.instance_count <= 10
    error_message = "Instance count must be between 1 and 10."
  }
}

# Example: Flexible input handling
variable "ports" {
  description = "Ports (can be list or single value)"
  type        = any
}

locals {
  # Ensure ports is always a list (handles both single value and list inputs)
  ports_list = try(tolist(var.ports), [var.ports])
  # If var.ports = 80, Result: [80]
  # If var.ports = [80, 443], Result: [80, 443]

  # Convert all to numbers (in case they're strings)
  ports_numbers = [
    for port in local.ports_list :
    tonumber(port)
  ]
  # If ports_list = ["80", "443"], Result: [80, 443]
}

# Example: Dynamic type conversion
locals {
  # Input could be string or number
  input_value = var.dynamic_input
  # Example: input_value could be 42 or "42"

  # Safely convert based on type
  as_string = tostring(local.input_value)
  # Result: "42" (regardless of input type)

  as_number = try(tonumber(local.input_value), 0)
  # Result: 42 (or 0 if conversion fails)

  as_bool = try(tobool(local.input_value), false)
  # Result: true if input is truthy, false otherwise or on error

  # Check type and handle accordingly
  is_number = type(local.input_value) == "number"
  # Result: true if input is number, false otherwise

  is_string = type(local.input_value) == "string"
  # Result: true if input is string, false otherwise

  # Process based on type
  processed_value = local.is_number ? (
    local.input_value * 2  # Double if number
  ) : (
    length(local.input_value)  # Get length if string
  )
  # If input_value = 42, Result: 84
  # If input_value = "hello", Result: 5
}

# Example: Null safety
variable "optional_config" {
  type = object({
    host = string
    port = number
  })
  default = null
}

locals {
  # Safe access with try - won't error if var.optional_config is null
  config_host = try(var.optional_config.host, "default-host")
  # Result: "db.example.com" if config provided, otherwise "default-host"

  # Check if not null
  has_config = var.optional_config != null
  # Result: true if config is provided, false if null

  # Use coalesce for null handling - returns first non-null value
  final_host = coalesce(
    try(var.optional_config.host, null),
    var.fallback_host,
    "localhost"
  )
  # Result: First non-null value from the list
  # Priority: optional_config.host > fallback_host > "localhost"
}
```

---

## Best Practices

### 1. Code Organization

```hcl
# ❌ BAD: Everything in one file
# main.tf (5000 lines)

# ✅ GOOD: Organized structure
# main.tf         - Primary resources
# variables.tf    - Input variables
# outputs.tf      - Output values
# locals.tf       - Local values
# versions.tf     - Provider versions
# terraform.tfvars - Variable values

# ✅ GOOD: Logical grouping
# network.tf      - VPC, subnets, routing
# compute.tf      - EC2, ASG, ALB
# database.tf     - RDS, DynamoDB
# security.tf     - Security groups, IAM
```

### 2. Naming Conventions

```hcl
# ✅ GOOD: Consistent, descriptive names
resource "aws_instance" "web_server" {
  # Use snake_case for resource names
}

variable "instance_count" {
  # Use snake_case for variables
}

locals {
  environment_prefix = "prod"  # Use snake_case
  commonTags = {}              # ❌ Avoid camelCase
}

# ✅ GOOD: Descriptive names
resource "aws_s3_bucket" "application_logs" {
  bucket = "${var.project}-${var.environment}-logs"
}

# ❌ BAD: Unclear names
resource "aws_s3_bucket" "b1" {
  bucket = "my-bucket"
}
```

### 3. Use Variables for Reusability

```hcl
# ❌ BAD: Hard-coded values
resource "aws_instance" "web" {
  ami           = "ami-abc123"
  instance_type = "t2.micro"

  tags = {
    Environment = "production"
    Project     = "myapp"
  }
}

# ✅ GOOD: Parameterized configuration
variable "ami_id" {
  description = "AMI ID for EC2 instance"
  type        = string
}

variable "instance_type" {
  description = "Instance type"
  type        = string
  default     = "t2.micro"
}

variable "common_tags" {
  description = "Common resource tags"
  type        = map(string)
}

resource "aws_instance" "web" {
  ami           = var.ami_id
  instance_type = var.instance_type
  tags          = var.common_tags
}
```

### 4. Use Locals for Complex Expressions

```hcl
# ❌ BAD: Repeated complex expressions
resource "aws_instance" "web" {
  tags = merge(
    var.common_tags,
    {
      Name = "${var.project}-${var.environment}-web"
    }
  )
}

resource "aws_s3_bucket" "data" {
  tags = merge(
    var.common_tags,
    {
      Name = "${var.project}-${var.environment}-data"
    }
  )
}

# ✅ GOOD: DRY with locals
locals {
  name_prefix = "${var.project}-${var.environment}"

  common_tags = merge(
    var.base_tags,
    {
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  )
}

resource "aws_instance" "web" {
  tags = merge(
    local.common_tags,
    { Name = "${local.name_prefix}-web" }
  )
}
```

### 5. Validation and Error Handling

```hcl
# ✅ GOOD: Input validation
variable "environment" {
  description = "Environment name"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "instance_count" {
  description = "Number of instances"
  type        = number

  validation {
    condition     = var.instance_count >= 1 && var.instance_count <= 10
    error_message = "Instance count must be between 1 and 10."
  }
}

# ✅ GOOD: Safe access with try
locals {
  database_host = try(var.config.database.host, "localhost")
  database_port = try(var.config.database.port, 5432)
}
```

### 6. Use Meaningful Outputs

```hcl
# ✅ GOOD: Descriptive outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "web_server_endpoints" {
  description = "Public endpoints of web servers"
  value = {
    for instance in aws_instance.web :
    instance.id => instance.public_dns
  }
}

output "database_connection_string" {
  description = "Database connection string"
  value       = "${aws_db_instance.main.endpoint}/${var.database_name}"
  sensitive   = true
}
```

### 7. Comments and Documentation

```hcl
# ✅ GOOD: Clear documentation
# Create VPC for application infrastructure
# CIDR block is split into:
# - 3 public subnets (/20) for load balancers
# - 3 private subnets (/20) for application servers
# - 3 database subnets (/24) for RDS instances
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-vpc"
    }
  )
}

# ✅ GOOD: Document complex logic
locals {
  # Calculate subnet CIDRs from VPC CIDR
  # Pattern: /16 -> multiple /20 and /24 subnets
  subnet_cidrs = cidrsubnets(
    var.vpc_cidr,
    4, 4, 4,  # Public: /20 each (4096 IPs)
    4, 4, 4,  # Private: /20 each (4096 IPs)
    8, 8, 8   # Database: /24 each (256 IPs)
  )
}
```

### 8. Avoid Anti-Patterns

```hcl
# ❌ BAD: Using count with maps/objects
resource "aws_instance" "web" {
  count = length(var.instance_config)  # Don't do this!
  # ...
}

# ✅ GOOD: Use for_each instead
resource "aws_instance" "web" {
  for_each = var.instance_config

  ami           = each.value.ami
  instance_type = each.value.type
}

# ❌ BAD: Inline complex expressions
resource "aws_instance" "web" {
  user_data = base64encode(templatefile("${path.module}/init.sh", merge(var.base_config, {name = format("%s-%s-%s", var.project, var.env, "web")}, var.env == "prod" ? {ha = true} : {})))
}

# ✅ GOOD: Break down into locals
locals {
  instance_name = "${var.project}-${var.env}-web"

  user_data_vars = merge(
    var.base_config,
    {
      name = local.instance_name
    },
    var.env == "prod" ? { ha = true } : {}
  )
}

resource "aws_instance" "web" {
  user_data = base64encode(
    templatefile("${path.module}/init.sh", local.user_data_vars)
  )
}
```

### 9. State Management

```hcl
# ✅ GOOD: Remote backend configuration
terraform {
  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"

    # Enable versioning on S3 bucket
    # Enable DynamoDB table for state locking
  }
}

# ✅ GOOD: Workspace-aware configuration
locals {
  environment = terraform.workspace

  config = {
    dev = {
      instance_type = "t2.micro"
      instance_count = 1
    }
    prod = {
      instance_type = "t2.large"
      instance_count = 3
    }
  }

  env_config = local.config[local.environment]
}
```

### 10. Module Best Practices

```hcl
# ✅ GOOD: Reusable module structure
# modules/vpc/main.tf
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}

resource "aws_vpc" "main" {
  cidr_block = var.vpc_cidr
  tags       = var.tags
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

# Usage: root module
module "vpc" {
  source = "./modules/vpc"

  vpc_cidr           = "10.0.0.0/16"
  availability_zones = ["us-east-1a", "us-east-1b"]

  tags = local.common_tags
}
```

---

**Last updated:** 2025-11-18
