from flask import Blueprint, jsonify
import platform
import psutil
import cpuinfo
import GPUtil
import traceback
import subprocess
import json
import re

system_bp = Blueprint('system', __name__)

@system_bp.route('/specs', methods=['GET'])
def get_system_specs():
    try:
        specs = {
            "os": get_os_info(),
            "cpu": get_cpu_info(),
            "ram": get_ram_info(),
            "gpu": get_gpu_info(),
            "status": "success"
        }
        return jsonify(specs), 200, {'Content-Type': 'application/json'}
    except Exception as e:
        return jsonify({
            "status": "error",
            "error": str(e),
            "details": traceback.format_exc()
        }), 500, {'Content-Type': 'application/json'}

def get_os_info():
    try:
        return {
            "system": platform.system(),
            "release": platform.release(),
            "version": platform.version(),
            "machine": platform.machine(),
            "full_name": f"{platform.system()} {platform.release()}"
        }
    except Exception as e:
        return {"error": f"Erro ao obter info do OS: {str(e)}"}

def get_cpu_info():
    try:
        info = cpuinfo.get_cpu_info()
        return {
            "brand": info.get("brand_raw", "Não detectado"),
            "cores_physical": psutil.cpu_count(logical=False),
            "cores_logical": psutil.cpu_count(logical=True),
            "frequency": {
                "current": psutil.cpu_freq().current if psutil.cpu_freq() else "N/A",
                "min": psutil.cpu_freq().min if psutil.cpu_freq() else "N/A",
                "max": psutil.cpu_freq().max if psutil.cpu_freq() else "N/A"
            },
            "usage_percent": psutil.cpu_percent(interval=1),
            "architecture": info.get("arch", "N/A")
        }
    except Exception as e:
        return {"error": f"Erro ao obter info da CPU: {str(e)}"}

def get_ram_info():
    try:
        ram = psutil.virtual_memory()
        return {
            "total": f"{ram.total / (1024.0 ** 3):.2f} GB",
            "available": f"{ram.available / (1024.0 ** 3):.2f} GB",
            "used": f"{ram.used / (1024.0 ** 3):.2f} GB",
            "percent_used": f"{ram.percent}%",
            "raw": {
                "total": ram.total,
                "available": ram.available,
                "used": ram.used,
                "percent": ram.percent,
                "total_gb": round(ram.total / (1024.0 ** 3), 2)
            }
        }
    except Exception as e:
        return {"error": f"Erro ao obter info da RAM: {str(e)}"}

def get_gpu_info():
    try:
        # Primeira tentativa: usando GPUtil
        try:
            gpus = GPUtil.getGPUs()
            if gpus:
                gpu = gpus[0]  # Pega a primeira GPU
                return {
                    "name": gpu.name,
                    "memory": {
                        "total": f"{gpu.memoryTotal} MB",
                        "used": f"{gpu.memoryUsed} MB",
                        "free": f"{gpu.memoryFree} MB"
                    },
                    "load": f"{gpu.load * 100:.1f}%",
                    "temperature": f"{gpu.temperature}°C" if gpu.temperature else "N/A",
                    "driver": gpu.driver if hasattr(gpu, 'driver') else "N/A"
                }
        except Exception as gpu_util_error:
            # Segunda tentativa: usando WMI (Windows)
            try:
                import wmi
                computer = wmi.WMI()
                gpu_info = computer.Win32_VideoController()[0]
                return {
                    "name": gpu_info.Name.strip(),
                    "driver_version": getattr(gpu_info, 'DriverVersion', 'N/A'),
                    "memory": {
                        "total": f"{int(getattr(gpu_info, 'AdapterRAM', 0))/(1024**2):.0f} MB" 
                        if hasattr(gpu_info, 'AdapterRAM') and gpu_info.AdapterRAM else "N/A"
                    },
                    "resolution": f"{getattr(gpu_info, 'CurrentHorizontalResolution', 'N/A')}x{getattr(gpu_info, 'CurrentVerticalResolution', 'N/A')}",
                    "refresh_rate": f"{getattr(gpu_info, 'CurrentRefreshRate', 'N/A')} Hz"
                }
            except Exception as wmi_error:
                # Terceira tentativa: usando PowerShell (Windows)
                try:
                    cmd = 'powershell "Get-WmiObject Win32_VideoController | Select-Object Name, DriverVersion, AdapterRAM | ConvertTo-Json"'
                    result = subprocess.run(cmd, capture_output=True, text=True, shell=True)
                    if result.returncode == 0:
                        gpu_data = json.loads(result.stdout)
                        if isinstance(gpu_data, list):
                            gpu_data = gpu_data[0]
                        return {
                            "name": gpu_data.get('Name', 'Unknown'),
                            "driver_version": gpu_data.get('DriverVersion', 'N/A'),
                            "memory": {
                                "total": f"{int(gpu_data.get('AdapterRAM', 0))/(1024**2):.0f} MB" 
                                if gpu_data.get('AdapterRAM') else "N/A"
                            }
                        }
                except Exception as ps_error:
                    # Última tentativa: usando lscpu/lshw (Linux)
                    try:
                        if platform.system() == "Linux":
                            result = subprocess.run(['lspci', '-v'], capture_output=True, text=True)
                            if result.returncode == 0:
                                for line in result.stdout.split('\n'):
                                    if 'VGA compatible controller' in line or 'Display controller' in line:
                                        gpu_name = line.split(': ')[-1]
                                        return {
                                            "name": gpu_name,
                                            "source": "lspci"
                                        }
                    except Exception as linux_error:
                        raise Exception(f"Todos os métodos falharam. GPUtil: {gpu_util_error}, WMI: {wmi_error}, PowerShell: {ps_error}, Linux: {linux_error}")

    except Exception as e:
        return {"error": f"Erro ao obter info da GPU: {str(e)}"}
    
    return {"error": "Nenhuma GPU detectada por nenhum método"}

@system_bp.route('/compare', methods=['POST'])
def compare_specs():
    """
    Compara as especificações do usuário com os requisitos do jogo
    """
    try:
        from flask import request
        data = request.get_json()
        
        if not data or 'game_requirements' not in data:
            return jsonify({'error': 'Requisitos do jogo não fornecidos'}), 400
        
        # Obter especificações do sistema
        user_specs = {
            "os": get_os_info(),
            "cpu": get_cpu_info(),
            "ram": get_ram_info(),
            "gpu": get_gpu_info()
        }
        
        game_reqs = data['game_requirements']
        comparison_type = data.get('type', 'minimum')  # minimum ou recommended
        
        # Realizar comparação
        comparison_result = perform_comparison(user_specs, game_reqs, comparison_type)
        
        return jsonify({
            'user_specs': user_specs,
            'game_requirements': game_reqs,
            'comparison': comparison_result,
            'status': 'success'
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500

def perform_comparison(user_specs, game_reqs, req_type):
    """
    Realiza a comparação inteligente entre as specs do usuário e requisitos do jogo
    """
    requirements = game_reqs.get(req_type, {})
    if not requirements:
        return {'error': f'Requisitos {req_type} não disponíveis'}
    
    comparison = {
        'overall_compatible': True,
        'details': {},
        'score': 0,
        'total_checks': 0
    }
    
    # Comparar OS
    if requirements.get('os'):
        os_compatible = compare_os(user_specs['os'], requirements['os'])
        comparison['details']['os'] = os_compatible
        comparison['total_checks'] += 1
        if os_compatible['compatible']:
            comparison['score'] += 1
        else:
            comparison['overall_compatible'] = False
    
    # Comparar RAM
    if requirements.get('memory'):
        ram_compatible = compare_ram(user_specs['ram'], requirements['memory'])
        comparison['details']['ram'] = ram_compatible
        comparison['total_checks'] += 1
        if ram_compatible['compatible']:
            comparison['score'] += 1
        else:
            comparison['overall_compatible'] = False
    
    # Comparar CPU (básico)
    if requirements.get('processor'):
        cpu_compatible = compare_cpu(user_specs['cpu'], requirements['processor'])
        comparison['details']['cpu'] = cpu_compatible
        comparison['total_checks'] += 1
        if cpu_compatible['compatible']:
            comparison['score'] += 1
    
    # Comparar GPU (básico)
    if requirements.get('graphics'):
        gpu_compatible = compare_gpu(user_specs['gpu'], requirements['graphics'])
        comparison['details']['gpu'] = gpu_compatible
        comparison['total_checks'] += 1
        if gpu_compatible['compatible']:
            comparison['score'] += 1
    
    # Calcular porcentagem de compatibilidade
    if comparison['total_checks'] > 0:
        comparison['compatibility_percentage'] = (comparison['score'] / comparison['total_checks']) * 100
    else:
        comparison['compatibility_percentage'] = 0
    
    return comparison

def compare_os(user_os, required_os):
    """Compara sistema operacional"""
    if user_os.get('error'):
        return {'compatible': False, 'reason': 'Não foi possível detectar o OS', 'confidence': 'low'}
    
    user_system = user_os.get('system', '').lower()
    required_lower = required_os.lower()
    
    # Verificações básicas
    if 'windows' in required_lower and 'windows' in user_system:
        # Comparar versões do Windows
        user_version = user_os.get('release', '')
        if 'windows 10' in required_lower or 'windows 11' in required_lower:
            if user_version in ['10', '11']:
                return {'compatible': True, 'reason': 'Windows compatível', 'confidence': 'high'}
            else:
                return {'compatible': False, 'reason': f'Windows {user_version} pode não ser compatível', 'confidence': 'medium'}
        return {'compatible': True, 'reason': 'Windows detectado', 'confidence': 'medium'}
    
    elif 'linux' in required_lower and 'linux' in user_system:
        return {'compatible': True, 'reason': 'Linux compatível', 'confidence': 'high'}
    
    elif 'mac' in required_lower and 'darwin' in user_system:
        return {'compatible': True, 'reason': 'macOS compatível', 'confidence': 'high'}
    
    return {'compatible': False, 'reason': 'OS não compatível ou não detectado', 'confidence': 'low'}

def compare_ram(user_ram, required_ram):
    """Compara memória RAM"""
    if user_ram.get('error'):
        return {'compatible': False, 'reason': 'Não foi possível detectar a RAM', 'confidence': 'low'}
    
    try:
        user_ram_gb = user_ram['raw']['total_gb']
        
        # Extrair quantidade de RAM necessária
        required_text = required_ram.lower()
        ram_match = re.search(r'(\d+)\s*gb', required_text)
        
        if ram_match:
            required_gb = int(ram_match.group(1))
            if user_ram_gb >= required_gb:
                return {
                    'compatible': True, 
                    'reason': f'RAM suficiente: {user_ram_gb:.1f}GB >= {required_gb}GB',
                    'confidence': 'high',
                    'user_value': f'{user_ram_gb:.1f}GB',
                    'required_value': f'{required_gb}GB'
                }
            else:
                return {
                    'compatible': False, 
                    'reason': f'RAM insuficiente: {user_ram_gb:.1f}GB < {required_gb}GB',
                    'confidence': 'high',
                    'user_value': f'{user_ram_gb:.1f}GB',
                    'required_value': f'{required_gb}GB'
                }
        else:
            return {'compatible': True, 'reason': 'Não foi possível extrair requisito de RAM', 'confidence': 'low'}
    
    except Exception as e:
        return {'compatible': False, 'reason': f'Erro na comparação de RAM: {str(e)}', 'confidence': 'low'}

def compare_cpu(user_cpu, required_cpu):
    """Compara processador (comparação básica)"""
    if user_cpu.get('error'):
        return {'compatible': False, 'reason': 'Não foi possível detectar a CPU', 'confidence': 'low'}
    
    user_brand = user_cpu.get('brand', '').lower()
    required_lower = required_cpu.lower()
    
    # Verificações básicas de marca
    if ('intel' in required_lower and 'intel' in user_brand) or \
       ('amd' in required_lower and 'amd' in user_brand):
        return {'compatible': True, 'reason': 'Marca de CPU compatível', 'confidence': 'medium'}
    
    # Se não conseguir determinar, assume compatível
    return {'compatible': True, 'reason': 'CPU detectada (compatibilidade não verificada)', 'confidence': 'low'}

def compare_gpu(user_gpu, required_gpu):
    """Compara placa de vídeo (comparação básica)"""
    if user_gpu.get('error'):
        return {'compatible': False, 'reason': 'Não foi possível detectar a GPU', 'confidence': 'low'}
    
    user_name = user_gpu.get('name', '').lower()
    required_lower = required_gpu.lower()
    
    # Verificações básicas
    if ('nvidia' in required_lower and 'nvidia' in user_name) or \
       ('amd' in required_lower and 'amd' in user_name) or \
       ('intel' in required_lower and 'intel' in user_name):
        return {'compatible': True, 'reason': 'Marca de GPU compatível', 'confidence': 'medium'}
    
    # Se não conseguir determinar, assume compatível
    return {'compatible': True, 'reason': 'GPU detectada (compatibilidade não verificada)', 'confidence': 'low'}

@system_bp.route('/test', methods=['GET'])
def test_components():
    """Endpoint para testar componentes individualmente"""
    results = {
        "os": test_os(),
        "cpu": test_cpu(),
        "ram": test_ram(),
        "gpu": test_gpu()
    }
    return jsonify(results)

def test_os():
    try:
        return f"{platform.system()} {platform.release()}"
    except:
        return "Erro no OS"

def test_cpu():
    try:
        return cpuinfo.get_cpu_info()["brand_raw"]
    except:
        return "Erro na CPU"

def test_ram():
    try:
        ram = psutil.virtual_memory()
        return f"Total: {ram.total / (1024.0 ** 3):.2f} GB"
    except:
        return "Erro na RAM"

def test_gpu():
    try:
        gpus = GPUtil.getGPUs()
        return gpus[0].name if gpus else "Sem GPU"
    except:
        return "Erro na GPU"

