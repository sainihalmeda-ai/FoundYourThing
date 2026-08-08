BASE = "https://foundyourthing-api.onrender.com"

# Reuse local QA against production
import runpy
import pathlib
src = pathlib.Path(__file__).with_name("qa_critical_path.py").read_text(encoding="utf-8")
src = src.replace('BASE = "http://127.0.0.1:8000"', f'BASE = "{BASE}"')
path = pathlib.Path(__file__).with_name("_qa_prod_tmp.py")
path.write_text(src, encoding="utf-8")
runpy.run_path(str(path))
path.unlink(missing_ok=True)
