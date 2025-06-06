from setuptools import setup, find_packages

setup(
    name="zeus-framework",
    version="0.0.28",
    packages=find_packages(where="core"),
    package_dir={"": "core"},
    python_requires=">=3.8",
    install_requires=[
        "tensorflow>=2.0.0",
        "numpy",
        "nltk",
        "spacy",
        "sqlalchemy",
        "click"
    ],
    entry_points={
        'console_scripts': [
            'zeus=orchestrator:main',
        ],
    },
)
