# Ajusta o atraso entre palavras/letras para 30% (o PowerPoint grava 10% por padrão)
import re, sys, zipfile, shutil, os

src = sys.argv[1]
tmp = src + '.tmp'
contagem = 0
with zipfile.ZipFile(src) as zin, zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED) as zout:
    for item in zin.infolist():
        dados = zin.read(item.filename)
        if re.match(r'ppt/slides/slide\d+\.xml$', item.filename):
            xml = dados.decode('utf-8')
            xml, n = re.subn(r'(<p:iterate type="(?:wd|lt)"[^>]*>\s*<p:tmPct val=")\d+(")', r'\g<1>30000\2', xml)
            contagem += n
            dados = xml.encode('utf-8')
        zout.writestr(item, dados)
shutil.move(tmp, src)
print('atrasos ajustados:', contagem)
