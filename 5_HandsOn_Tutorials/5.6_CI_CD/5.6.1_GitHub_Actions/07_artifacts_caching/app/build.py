"""Build script that demonstrates artifact creation."""

import os
import json
from datetime import datetime
import hashlib


def create_build_info():
    """Create build information file."""
    build_info = {
        "timestamp": datetime.now().isoformat(),
        "version": os.environ.get("GITHUB_SHA", "dev")[:7],
        "branch": os.environ.get("GITHUB_REF_NAME", "unknown"),
        "run_id": os.environ.get("GITHUB_RUN_ID", "0"),
    }

    # Create build directory
    os.makedirs("build", exist_ok=True)

    # Write build info
    with open("build/info.json", "w") as f:
        json.dump(build_info, f, indent=2)

    print(f"Build info created: {json.dumps(build_info, indent=2)}")

    return build_info


def create_checksum():
    """Create checksums for build artifacts."""
    checksums = {}

    for root, dirs, files in os.walk("build"):
        for file in files:
            if file.endswith(".json"):
                continue  # Skip checksum file itself

            filepath = os.path.join(root, file)
            with open(filepath, "rb") as f:
                checksum = hashlib.sha256(f.read()).hexdigest()
                checksums[file] = checksum

    # Write checksums
    with open("build/checksums.json", "w") as f:
        json.dump(checksums, f, indent=2)

    print(f"Checksums created: {json.dumps(checksums, indent=2)}")


if __name__ == "__main__":
    print("Starting build process...")
    create_build_info()
    create_checksum()
    print("Build complete!")
