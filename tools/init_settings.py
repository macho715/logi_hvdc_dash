#!/usr/bin/env python
import subprocess
subprocess.call(['git','init','-b','main'])
subprocess.call(['pre-commit','install'])
