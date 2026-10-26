#!/usr/bin/env python3
"""Validate proposed content and tiny economic fixtures; not a running game."""
from pathlib import Path
import json
R=Path(__file__).resolve().parents[1]
def load(n):return json.loads((R/'data'/n).read_text())
def keyed(xs):
 d={x['id']:x for x in xs};assert len(d)==len(xs),'duplicate id';return d
E=load('economy.json');U=keyed(load('upgrades.json')['nodes'])
P=keyed(load('products.json')['products']);W=keyed(load('workers.json')['workers'])
resources=set(E['resources'])
assert len(U)==96 and len({x['branch'] for x in U.values()})==16
for n in U.values():
 assert n['cashCost']>0 and n['rank'] in range(1,7)
 assert n['visualContract'] and n['mechanic']
 assert all(x in U for x in n['requires'])
visiting=set();done=set()
def visit(i):
 assert i not in visiting,('cyclic upgrade',i)
 if i in done:return
 visiting.add(i)
 for d in U[i]['requires']:visit(d)
 visiting.remove(i);done.add(i)
for i in U:visit(i)
for branch in {x['branch'] for x in U.values()}:
 a=sorted([x for x in U.values() if x['branch']==branch],key=lambda x:x['rank'])
 assert [x['rank'] for x in a]==list(range(1,7))
 assert all(x['cashCost']<y['cashCost'] for x,y in zip(a,a[1:]))
for p in P.values():
 assert p['unlock'] is None or p['unlock'] in U
 assert len(p['stages'])==len(p['seconds']) and min(p['seconds'])>0
 assert all(k in resources|P.keys() and isinstance(v,int) and v>0 for k,v in p['inputs'].items())
 assert p['sale']>0
# Product recipes are acyclic too.
pv=set();pd=set()
def product_visit(i):
 assert i not in pv
 if i in pd:return
 pv.add(i)
 for k in P[i]['inputs']:
  if k in P:product_visit(k)
 pv.remove(i);pd.add(i)
for i in P:product_visit(i)
for f,key in [('properties.json','properties'),('events.json','events'),('capers.json','capers')]:
 d=keyed(load(f)[key])
 for x in d.values():assert x['unlock'] is None or x['unlock'] in U
for c in load('capers.json')['capers']:assert c['rewardBlueprintFor'] in U
assert W['assembler']['baseHireCost']==E['firstAssemblerHireCost']
# Prepaid opening supplies: four real manual sales then hire.
cash=E['startingCash'];stock=dict(E['startingInventory']);sold=0
for _ in range(4):
 for k,v in P['nightglass']['inputs'].items():assert stock[k]>=v;stock[k]-=v
 sold+=1;cash+=E['basicSale']
assert cash==68 and sold==4 and stock=={'blank_stock':8,'sleeve':8}
cash-=E['firstAssemblerHireCost'];assert cash==8
net=E['basicSale']-E['purchasePrices']['blank_stock']-E['purchasePrices']['sleeve']-sum(E['commissionPerCompletedTask'].values())
assert net==5
assert sum(E['manualSeconds'].values())*4==64
S=load('simulation.json')
assert abs(S['basePackagingSeconds']/(1+S['packagingSpeedStep'])-6.95652173913)<1e-6
# Discrete-time bounded production fixture. No walking, demand limit or wage simulation.
def simulate(assembly_seconds,packers,seconds=120):
 stock=1000;prepared=0;packed=0;sold=0
 # Jobs each hold exactly one item of WIP. Time measured in 0.1s ticks.
 durations=[round(assembly_seconds*10)]+[80]*packers+[20]
 jobs=[0]*len(durations)
 for tick in range(round(seconds*10)+1):
  for i in range(len(jobs)):
   if jobs[i]>0:
    jobs[i]-=1
    if jobs[i]==0:
     if i==0:prepared+=1
     elif i==len(jobs)-1:sold+=1
     else:packed+=1
  for i,d in enumerate(durations):
   if jobs[i]!=0:continue
   if i==0 and stock>0:stock-=1;jobs[i]=d
   elif 0<i<len(jobs)-1 and prepared>0:prepared-=1;jobs[i]=d
   elif i==len(jobs)-1 and packed>0:packed-=1;jobs[i]=d
  assert min(stock,prepared,packed,sold)>=0
  assert stock+prepared+packed+sold+sum(j>0 for j in jobs)==1000
 return sold
base=simulate(6,1);extra=simulate(6,2);balanced=simulate(4,2)
assert base<extra<balanced
assert extra<base*2,'second packer cannot double a supply-limited line'
print(json.dumps({'status':'PASS','upgradeNodes':len(U),'products':len(P),'workerRoles':len(W),'openingCashAfterFourSalesAndHire':cash,'basicNetAfterTwoCommissions':net,'twoMinuteSold_fixture':{'onePacker':base,'twoPackersSupplyLimited':extra,'twoPackersFasterAssembly':balanced}},indent=2))
print('Fixture excludes walking, wage affordability, live rendering and full game balance. No gameplay/device verification claimed.')
