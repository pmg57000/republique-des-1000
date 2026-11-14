import json, re, subprocess, sys, difflib
m=json.load(open('map.json'))
old=json.load(open('old.json')); new=json.load(open('new.json'))
nsrc=open('/home/claude/steven/bundle.js').read()
pairs={int(a):b for a,b in m['pairs'].items()}
oi={o['name']:o for o in old}; ni={n['i']:n for n in new}
def pretty(code, isfunc):
    if not isfunc: code='var '+code
    p=subprocess.run(['prettier','--parser','babel','--print-width','110'],input=code,capture_output=True,text=True)
    return p.stdout if p.returncode==0 else code
def norm(t): return ['§' if x.startswith('§') else x for x in t]
names=sys.argv[1:]
for name in names:
    o=oi[name]; n=ni[pairs[o['i']]]
    a=subprocess.run(['node','rename.cjs','/home/claude/work/bundle.js',str(o['start']),str(o['end']),'map.json'],capture_output=True,text=True).stdout
    a=pretty(a,o['kind']=='function').splitlines(); b=pretty(nsrc[n['start']:n['end']],n['kind']=='function').splitlines()
    print(f"######## {name} -> {n['name']}")
    for l in difflib.unified_diff(a,b,lineterm='',n=1): print(l)
