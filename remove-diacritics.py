# remove diacritics:
import re

pattern = '[\u0591-\u05c7]'

def replace(val):
    return re.sub(pattern,"",val)