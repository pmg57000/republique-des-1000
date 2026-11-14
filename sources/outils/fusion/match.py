import json, collections, difflib, re, sys
old=json.load(open('old.json')); new=json.load(open('new.json'))
def norm(toks): return tuple('§' if t.startswith('§') else t for t in toks)
oldtop={n for o in old for n in o['name'].split(',') if n}
newtop={n for o in new for n in o['name'].split(',') if n}
byk=collections.defaultdict(list)
for o in new: byk[norm(o['toks'])].append(o)
votes=collections.defaultdict(collections.Counter)
pairs={}
def align(a,b,w=1):
    if len(a['toks'])!=len(b['toks']): return
    for x,y in zip(a['toks'],b['toks']):
        if x.startswith('§') and y.startswith('§'):
            xn=x[1:]; yn=y[1:]
            if xn in oldtop and yn in newtop: votes[xn][yn]+=w
exact=0
for o in old:
    k=norm(o['toks']); c=byk.get(k,[])
    if len(c)==1:
        exact+=1; pairs[o['i']]=c[0]['i']; align(o,c[0],3)
print('exact', exact, 'of', len(old))
# fuzzy for remaining: compare by difflib on norm tokens among candidates of same kind with similar length
newfree=[n for n in new if n['i'] not in set(pairs.values())]
fuzzy=0
for o in old:
    if o['i'] in pairs: continue
    a=norm(o['toks']); best=None; bs=0
    for n in newfree:
        if n['kind']!=o['kind']: continue
        b=norm(n['toks'])
        if not (0.6*len(a) <= len(b) <= 1.6*len(a)+20): continue
        sm=difflib.SequenceMatcher(None,a,b,autojunk=False)
        if sm.real_quick_ratio()<bs or sm.quick_ratio()<bs: continue
        r=sm.ratio()
        if r>bs: bs=r; best=n
    if best and bs>0.6:
        pairs[o['i']]=best['i']; fuzzy+=1
        # align with opcodes
        sm=difflib.SequenceMatcher(None,o['toks'] and norm(o['toks']),norm(best['toks']),autojunk=False)
        for tag,i1,i2,j1,j2 in sm.get_opcodes():
            if tag=='equal':
                for x,y in zip(o['toks'][i1:i2],best['toks'][j1:j2]):
                    if x.startswith('§') and y.startswith('§') and x[1:] in oldtop and y[1:] in newtop: votes[x[1:]][y[1:]]+=1
        o['_score']=bs
print('fuzzy', fuzzy)
# declaration-name votes from pairs
oi={o['i']:o for o in old}; ni={n['i']:n for n in new}
for a,b in pairs.items():
    an=oi[a]['name'].split(','); bn=ni[b]['name'].split(',')
    if len(an)==len(bn):
        for x,y in zip(an,bn):
            if x and y: votes[x][y]+=10
mapping={k:v.most_common(1)[0][0] for k,v in votes.items()}
json.dump({'mapping':mapping,'votes':{k:dict(v) for k,v in votes.items()},'pairs':{str(a):b for a,b in pairs.items()},'scores':{o['name']:o.get('_score',1.0) for o in old if o['i'] in pairs}},open('map.json','w'))
print('mapped names', len(mapping))
