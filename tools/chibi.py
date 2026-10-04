# Bộ sinh ảnh vector Huyền My (v2: tóc đen tuyền, mái thẳng, nón vòm thanh, voan trùm nón, sao ngũ hành, sen cách điệu; có bản chuyển động). Chạy: python3 tools/chibi.py public/art
# Bộ sinh ảnh vector Huyền My (chibi). Chạy: python3 tools/chibi.py public/art
import math, sys

OUT = '#2a1a4d'   # nét viền tím than đậm
def bez(L, C, R, t): return ((1-t)**2*L[0]+2*(1-t)*t*C[0]+t*t*R[0], (1-t)**2*L[1]+2*(1-t)*t*C[1]+t*t*R[1])

A=(300,112); L=(82,256); R=(518,256); C=(300,300)   # nón lá
ELEM=[('Mộc','#52d68f'),('Hỏa','#ff6a4d'),('Thổ','#f0bd4a'),('Kim','#f6f1e2'),('Thủy','#5aa9ff')]
def hat():
    s=[]
    d=f"M {A[0]} {A[1]} C {A[0]-72} {A[1]+8} {L[0]+84} {L[1]-46} {L[0]} {L[1]} Q {C[0]} {C[1]} {R[0]} {R[1]} C {R[0]-84} {R[1]-46} {A[0]+72} {A[1]+8} {A[0]} {A[1]} Z"
    s.append(f'<clipPath id="hatclip"><path d="{d}"/></clipPath>')
    s.append('<linearGradient id="hatg" x1="0" y1="0" x2="1" y2="0.2"><stop offset="0" stop-color="#fbebbd"/><stop offset=".45" stop-color="#f0d38d"/><stop offset="1" stop-color="#d5ac5e"/></linearGradient>')
    s.append('<radialGradient id="furg" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#f6f2ff"/><stop offset="1" stop-color="#ddd3f5"/></radialGradient>')
    s.append(f'<g id="hat"><path d="{d}" fill="url(#hatg)"/>')
    s.append('<g clip-path="url(#hatclip)" fill="none" stroke="#b58a3e" stroke-linecap="round">')
    ts=[0,.2,.4,.6,.8,1.0]
    for i,(nm,col) in enumerate(ELEM):
        pts=[bez(L,C,R,ts[i]+(ts[i+1]-ts[i])*k/8) for k in range(9)]
        poly=' '.join(f'{x:.1f},{y:.1f}' for x,y in pts)
        s.append(f'<polygon points="{A[0]},{A[1]} {poly}" fill="{col}" fill-opacity=".17" stroke="none"/>')
    for i in range(1,40):
        t=i/40; bx,by=bez(L,C,R,t)
        s.append(f'<line x1="{A[0]}" y1="{A[1]}" x2="{bx:.1f}" y2="{by:.1f}" stroke-width="1.2" opacity=".38"/>')
    for k in range(1,9):
        f=k/9; l=(A[0]+f*(L[0]-A[0]),A[1]+f*(L[1]-A[1])); c=(A[0]+f*(C[0]-A[0]),A[1]+f*(C[1]-A[1])); r=(A[0]+f*(R[0]-A[0]),A[1]+f*(R[1]-A[1]))
        s.append(f'<path d="M {l[0]:.1f} {l[1]:.1f} Q {c[0]:.1f} {c[1]:.1f} {r[0]:.1f} {r[1]:.1f}" stroke-width="1.8" opacity=".42"/>')
    cx,cy,rr=300,196,64
    P=[(cx+rr*math.cos(math.radians(-90+72*k)), cy+rr*math.sin(math.radians(-90+72*k))) for k in range(5)]
    s.append(f'<circle cx="{cx}" cy="{cy}" r="{rr+8}" fill="none" stroke="#9b6b1f" stroke-width="1.8" stroke-dasharray="2 5" opacity=".7"/>')
    star=' '.join(f'{P[(2*k)%5][0]:.1f},{P[(2*k)%5][1]:.1f}' for k in range(5))
    s.append(f'<polygon points="{star}" fill="#fff7d6" fill-opacity=".35" stroke="#9b6b1f" stroke-width="2.8" stroke-linejoin="round"/>')
    pent=' '.join(f'{x:.1f},{y:.1f}' for x,y in P)
    s.append(f'<polygon points="{pent}" fill="none" stroke="#c9972f" stroke-width="1.6" opacity=".8"/>')
    names=['Hỏa','Thổ','Kim','Thủy','Mộc']; colmap=dict(ELEM)
    for (x,y),nm in zip(P,names):
        c=colmap[nm]
        s.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="8.5" fill="{c}" stroke="#6b4414" stroke-width="2.2"/><circle cx="{x-2.5:.1f}" cy="{y-2.5:.1f}" r="2.6" fill="#fff" opacity=".85"/>')
    s.append(f'<circle cx="{cx}" cy="{cy}" r="7" fill="#fff3b0" stroke="#9b6b1f" stroke-width="1.8"/>')
    s.append('</g>')
    s.append(f'<path d="M 300 {A[1]+12} C 268 {A[1]+50} 210 {A[1]+104} 160 {A[1]+158} C 196 {A[1]+110} 250 {A[1]+54} 300 {A[1]+12} Z" fill="#fffbe8" opacity=".5"/>')
    s.append(f'<path d="{d}" fill="none" stroke="{OUT}" stroke-width="3.5" stroke-linejoin="round"/>')
    import random
    rnd=random.Random(11)
    puffs=[]
    N=30
    for i in range(N+1):
        t=i/N; x,y=bez(L,C,R,t)
        rad=7.6+rnd.random()*2.0
        puffs.append((x+rnd.uniform(-1,1), y+2.5+rnd.uniform(-1,1.5), rad))
    for (x,y,r) in puffs: s.append(f'<circle cx="{x:.1f}" cy="{y+2:.1f}" r="{r:.1f}" fill="#d8cdf3" opacity=".5"/>')
    for (x,y,r) in puffs: s.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="url(#furg)" stroke="#e1d8f6" stroke-width=".9"/>')
    s.append(f'<g transform="translate(300 {A[1]}) scale(.7) translate(-300 {-A[1]})"><path d="M 300 {A[1]} C 288 {A[1]-8} 280 {A[1]+4} 292 {A[1]+10} C 296 {A[1]+4} 298 {A[1]+2} 300 {A[1]} C 302 {A[1]+2} 304 {A[1]+4} 308 {A[1]+10} C 320 {A[1]+4} 312 {A[1]-8} 300 {A[1]} Z" fill="#9a6ae8" stroke="#2a1a4d" stroke-width="2.5" stroke-linejoin="round"/><circle cx="300" cy="{A[1]+3}" r="4.5" fill="#f6d77a" stroke="#2a1a4d" stroke-width="1.8"/></g>')
    s.append('</g>')
    return '\n'.join(s)

SPN=[0]
def sparkle(x,y,r,fill='#fff6c9',op=1):
    SPN[0]+=1
    return f'<path class="sp" style="animation-delay:{SPN[0]*0.45:.2f}s" d="M {x} {y-r} Q {x} {y} {x+r} {y} Q {x} {y} {x} {y+r} Q {x} {y} {x-r} {y} Q {x} {y} {x} {y-r} Z" fill="{fill}" opacity="{op}"/>'
def flower(cx,cy,r,fill='#f7d56e',op=1):
    s=[]
    for i in range(5):
        a=i*72-90
        px=cx+math.cos(math.radians(a))*r*0.9; py=cy+math.sin(math.radians(a))*r*0.9
        s.append(f'<ellipse cx="{px:.1f}" cy="{py:.1f}" rx="{r*0.55:.1f}" ry="{r*0.8:.1f}" transform="rotate({a+90} {px:.1f} {py:.1f})" fill="{fill}" opacity="{op}"/>')
    s.append(f'<circle cx="{cx}" cy="{cy}" r="{r*0.35:.1f}" fill="#fff3b0" opacity="{op}"/>')
    return ''.join(s)
def sen(cx,cy,sc=1.0,fill='#f6d77a'):
    return (f'<g transform="translate({cx} {cy}) scale({sc})" stroke="#b9852a" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round">'
            f'<path d="M -3 3 C -26 2 -38 -12 -36 -26 C -24 -22 -10 -12 -3 3 Z" fill="{fill}"/><path d="M 3 3 C 26 2 38 -12 36 -26 C 24 -22 10 -12 3 3 Z" fill="{fill}"/>'
            f'<path d="M -2 1 C -18 -6 -24 -22 -18 -36 C -9 -28 -4 -14 -2 1 Z" fill="{fill}"/><path d="M 2 1 C 18 -6 24 -22 18 -36 C 9 -28 4 -14 2 1 Z" fill="{fill}"/>'
            f'<path d="M 0 0 C -10 -12 -9 -32 0 -46 C 9 -32 10 -12 0 0 Z" fill="#fff0b0"/>'
            f'<path d="M 0 -4 L 0 -34 M -12 -8 Q -16 -20 -12 -28 M 12 -8 Q 16 -20 12 -28" fill="none" stroke="#c99a3a" stroke-width="1.2"/>'
            f'<path d="M -22 6 Q -11 13 0 7 Q 11 13 22 6" fill="none" stroke="#b9852a" stroke-width="2"/></g>')
def lotus(cx,cy,s=1.0):
    p=[]
    for ang,col in [(-62,'#f48fb6'),(62,'#f48fb6'),(-32,'#f9b2cf'),(32,'#f9b2cf'),(0,'#ffd0e2')]:
        p.append(f'<path d="M 0 0 C -14 -16 -10 -40 0 -54 C 10 -40 14 -16 0 0 Z" transform="rotate({ang})" fill="{col}" stroke="{OUT}" stroke-width="2.4" stroke-linejoin="round"/>')
    return f'<g transform="translate({cx} {cy}) scale({s})">'+''.join(p)+'<ellipse cx="0" cy="2" rx="22" ry="6" fill="#7bc79a" stroke="#2a1a4d" stroke-width="2"/></g>'


def wave(x0,y0,x1,y1,n,amp,phase=0):
    d=''
    for i in range(n):
        xa=x0+(x1-x0)*i/n; xb=x0+(x1-x0)*(i+1)/n; ya=y0+(y1-y0)*i/n; yb=y0+(y1-y0)*(i+1)/n
        sg=1 if (i+phase)%2==0 else -1
        am=amp*(1+0.4*math.sin(i*1.9+phase))
        d+=f' C {xa+(xb-xa)*0.3:.1f} {ya+sg*am:.1f} {xa+(xb-xa)*0.7:.1f} {yb-sg*am:.1f} {xb:.1f} {yb:.1f}'
    return d

def veil_defs():
    return ('<linearGradient id="voanF" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#e6fff5" stop-opacity=".40"/><stop offset=".5" stop-color="#d4dcff" stop-opacity=".26"/><stop offset="1" stop-color="#ecd6ff" stop-opacity=".34"/></linearGradient>'
            '<linearGradient id="voanB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6fff5" stop-opacity=".36"/><stop offset="1" stop-color="#d9d0ff" stop-opacity=".44"/></linearGradient>'
            '<radialGradient id="faceg" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#3c3c3c"/><stop offset=".65" stop-color="#8c8c8c"/><stop offset="1" stop-color="#fff"/></radialGradient>'
            '<mask id="vmask" maskUnits="userSpaceOnUse" x="0" y="0" width="600" height="800"><rect width="600" height="800" fill="#fff"/><ellipse cx="300" cy="372" rx="150" ry="130" fill="url(#faceg)"/></mask>')

def veil_back(anim=False):
    def dd(ph): return ('M 112 236 C 40 330 74 440 24 556 C 4 616 36 670 12 724'+wave(12,724,584,716,5,30,ph)+' C 598 650 556 570 578 470 C 598 380 536 300 488 236 Z')
    d0=dd(1)
    anim_tag=f'<animate attributeName="d" dur="7s" repeatCount="indefinite" values="{d0};{dd(0)};{d0}" keyTimes="0;.5;1" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1"/>' if anim else ''
    out=[f'<g id="voan-sau"><path d="{d0}" fill="url(#voanB)" stroke="#f6f0ff" stroke-opacity=".7" stroke-width="2.2" stroke-linejoin="round">{anim_tag}</path>']
    for i in range(1,8):
        f=i/8; x0=112+(488-112)*f; x1=12+(584-12)*f
        sw=22*math.sin(i*1.4)
        out.append(f'<path d="M {x0:.0f} 244 C {x0+sw:.0f} 400 {x1-sw:.0f} 560 {x1:.0f} {716+10*math.sin(i*2.1):.0f}" fill="none" stroke="#fff" stroke-opacity="{0.30 if i%2 else 0.14}" stroke-width="2.4" stroke-linecap="round"/>')
    out.append('</g>'); return ''.join(out)

def veil_outline(phase):
    return ('M 300 76 C 372 78 480 156 546 246 C 584 304 528 410 552 496 C 574 566 612 604 590 676'
            +wave(590,676,38,704,5,34,phase)+
            ' C 62 650 -4 600 30 520 C 58 440 0 346 56 246 C 120 156 228 78 300 76 Z')

def veil_front(anim=False):
    out=['<g id="voan-truoc" mask="url(#vmask)">']
    d0=veil_outline(0)
    if anim:
        d1=veil_outline(1)
        out.append(f'<path d="{d0}" fill="url(#voanF)" stroke="#f8f4ff" stroke-opacity=".85" stroke-width="2.4" stroke-linejoin="round"><animate attributeName="d" dur="6s" repeatCount="indefinite" values="{d0};{d1};{d0}" keyTimes="0;.5;1" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1"/></path>')
    else:
        out.append(f'<path d="{d0}" fill="url(#voanF)" stroke="#f8f4ff" stroke-opacity=".85" stroke-width="2.4" stroke-linejoin="round"/>')
    for i in range(1,10):
        bx,by=bez(L,C,R,i/10); by-=30
        out.append(f'<path d="M 300 82 Q {300+(bx-300)*0.55:.0f} {82+(by-82)*0.45+6:.0f} {bx+(bx-300)*0.1:.0f} {by+6:.0f}" fill="none" stroke="#fff" stroke-opacity="{0.30 if i%2 else 0.16}" stroke-width="1.8" stroke-linecap="round"/>')
    for i in range(1,11):
        f=i/11; bx,by=bez(L,C,R,f); by-=30
        hx=38+(590-38)*f
        sw=30*math.sin(i*1.25)
        out.append(f'<path d="M {bx:.0f} {by+8:.0f} C {bx+sw:.0f} 360 {hx-sw*1.3:.0f} 540 {hx:.0f} {690+14*math.sin(i*1.9):.0f}" fill="none" stroke="#fff" stroke-opacity="{0.36 if i%2 else 0.16}" stroke-width="2.2" stroke-linecap="round"/>')
    out.append('<path d="M 70 290 C 30 400 80 480 40 600 C 74 520 108 440 96 330 Z" fill="#fff" opacity=".13"/>')
    out.append('<path d="M 520 300 C 560 400 520 500 566 610 C 536 520 496 450 496 340 Z" fill="#fff" opacity=".10"/>')
    for i in range(0,9):
        f=i/8; x=590+(38-590)*f; y=676+(704-676)*f+(-16*math.sin(f*math.pi*5))
        out.append(f'<circle cx="{x:.0f}" cy="{y+5:.0f}" r="3.2" fill="#fff" stroke="#bfb2e8" stroke-width="1.1" opacity=".9"/>')
    out.append('</g>')
    out.append('<g id="voan-bay">')
    out.append('<g class="tail" style="transform-origin:574px 560px"><path d="M 574 560 C 598 600 594 640 578 676 C 590 706 582 742 550 762 C 562 726 550 706 558 676 C 568 640 576 610 574 560 Z" fill="url(#voanB)" stroke="#f8f4ff" stroke-opacity=".85" stroke-width="2" stroke-linejoin="round"/><path d="M 574 600 C 584 640 576 690 558 742" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/></g>')
    out.append('<g class="tail t2" style="transform-origin:30px 600px"><path d="M 30 600 C 6 640 10 680 26 716 C 14 744 24 770 52 782 C 44 752 54 736 48 712 C 40 676 32 640 30 600 Z" fill="url(#voanB)" stroke="#f8f4ff" stroke-opacity=".85" stroke-width="2" stroke-linejoin="round"/><path d="M 28 640 C 22 676 32 724 50 770" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/></g>')
    out.append('</g>')
    return ''.join(out)

def character(with_veil=False, anim=False):
    S=[]
    # bóng dưới chân
    S.append('<ellipse cx="300" cy="768" rx="150" ry="16" fill="#1c1040" opacity=".28"/>')
    if with_veil: S.append(veil_defs()); S.append(veil_back(anim))
    # tóc sau
    S.append('<linearGradient id="hairg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2b2b31"/><stop offset=".5" stop-color="#101014"/><stop offset="1" stop-color="#000000"/></linearGradient><linearGradient id="hairg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#26262c"/><stop offset=".5" stop-color="#0d0d10"/><stop offset="1" stop-color="#000000"/></linearGradient>')
    S.append(f'<path id="hair-back" d="M 186 292 C 150 380 154 520 186 596 C 208 640 244 624 254 580 L 346 580 C 356 624 392 640 414 596 C 446 520 450 380 414 292 Z" fill="url(#hairg)" stroke="{OUT}" stroke-width="3.5" stroke-linejoin="round"/>')
    S.append('<path d="M 172 410 C 166 470 172 540 190 586" fill="none" stroke="#5a5a68" stroke-width="3.5" stroke-linecap="round" opacity=".45"/><path d="M 428 410 C 434 470 428 540 410 586" fill="none" stroke="#5a5a68" stroke-width="3.5" stroke-linecap="round" opacity=".45"/>')
    # quần lụa + hài
    S.append(f'<path d="M 246 632 L 296 632 L 292 742 L 226 742 Z" fill="#fff6e6" stroke="{OUT}" stroke-width="3.2" stroke-linejoin="round"/>')
    S.append(f'<path d="M 304 632 L 354 632 L 374 742 L 308 742 Z" fill="#fff6e6" stroke="{OUT}" stroke-width="3.2" stroke-linejoin="round"/>')
    S.append('<path d="M 262 640 L 258 738 M 340 640 L 346 738" stroke="#e8d7b8" stroke-width="3" opacity=".7"/>')
    for x in (258,342):
        S.append(f'<path d="M {x-36} 746 C {x-36} 726 {x+30} 726 {x+36} 746 C {x+38} 760 {x-38} 760 {x-36} 746 Z" fill="#a357d9" stroke="{OUT}" stroke-width="3.2" stroke-linejoin="round"/><path d="M {x-24} 742 C {x-10} 734 {x+14} 734 {x+26} 742" fill="none" stroke="#f6d77a" stroke-width="3" stroke-linecap="round"/>')
    # áo dài
    S.append('<linearGradient id="adg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9a69ea"/><stop offset=".55" stop-color="#7344c8"/><stop offset="1" stop-color="#4e2a97"/></linearGradient>')
    S.append('<linearGradient id="adg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a98af0"/><stop offset="1" stop-color="#6a3dc0"/></linearGradient>')
    # tà sau (hai bên)
    S.append(f'<path d="M 268 548 L 232 548 C 224 610 200 664 180 708 C 220 724 262 728 296 718 L 300 548 Z" fill="url(#adg)" stroke="{OUT}" stroke-width="3.5" stroke-linejoin="round"/>')
    S.append(f'<path d="M 332 548 L 368 548 C 376 610 400 664 420 708 C 380 724 338 728 304 718 L 300 548 Z" fill="url(#adg)" stroke="{OUT}" stroke-width="3.5" stroke-linejoin="round"/>')
    # thân áo
    S.append(f'<path d="M 252 470 C 236 484 246 520 258 560 L 342 560 C 354 520 364 484 348 470 C 336 462 320 458 300 458 C 280 458 264 462 252 470 Z" fill="url(#adg)" stroke="{OUT}" stroke-width="3.5" stroke-linejoin="round"/>')
    # tà trước (cánh phải chéo)
    S.append(f'<path d="M 300 470 L 346 500 C 352 540 356 590 366 650 C 372 690 372 712 392 726 C 352 742 318 738 292 724 C 300 650 304 560 300 470 Z" fill="url(#adg2)" stroke="{OUT}" stroke-width="3.5" stroke-linejoin="round"/>')
    S.append('<path d="M 300 470 L 346 500 L 344 512" fill="none" stroke="#f6d77a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>')
    for (x,y) in [(318,480),(334,492),(344,520),(346,552),(350,586)]:
        S.append(f'<circle cx="{x}" cy="{y}" r="3.2" fill="#f6d77a" stroke="{OUT}" stroke-width="1.6"/>')
    # đường viền vàng gấu áo + hoa sen thêu
    S.append('<path d="M 184 706 C 224 722 262 726 294 716" fill="none" stroke="#f6d77a" stroke-width="3.5" stroke-linecap="round"/><path d="M 308 722 C 346 736 380 730 396 722" fill="none" stroke="#f6d77a" stroke-width="3.5" stroke-linecap="round"/>')
    for (x,y,sc) in [(232,646,.62),(214,690,.5),(264,684,.56),(346,642,.62),(336,696,.56),(374,684,.5),(286,606,.42),(320,600,.42)]:
        S.append(sen(x,y,sc))
    S.append(sen(252,520,.36)); S.append(sen(348,520,.36))
    # tóc mai trước ngực
    for sgn in (-1,1):
        x=300+sgn*112
        S.append(f'<path d="M {x} 340 C {x+sgn*10} 400 {x+sgn*8} 462 {x-sgn*10} 520 C {x-sgn*20} 486 {x-sgn*22} 420 {x-sgn*16} 356 Z" fill="url(#hairg)" stroke="{OUT}" stroke-width="3.2" stroke-linejoin="round"/>')
    # cổ
    S.append(f'<path d="M 280 428 L 280 470 C 290 478 310 478 320 470 L 320 428 Z" fill="#ffd9c2" stroke="{OUT}" stroke-width="3"/>')
    S.append('<path d="M 280 440 C 292 450 308 450 320 440 L 320 428 L 280 428 Z" fill="#e8b79c" opacity=".6"/>')
    # cổ áo cao
    S.append(f'<path d="M 270 456 C 286 466 314 466 330 456 L 330 478 C 312 486 288 486 270 478 Z" fill="#8a57de" stroke="{OUT}" stroke-width="3" stroke-linejoin="round"/><path d="M 272 458 C 288 468 312 468 328 458" fill="none" stroke="#f6d77a" stroke-width="3" stroke-linecap="round"/>')
    # ===== đầu =====
    S.append('<radialGradient id="skin" cx=".5" cy=".42" r=".65"><stop offset="0" stop-color="#fff0e4"/><stop offset=".7" stop-color="#ffdcc6"/><stop offset="1" stop-color="#f3bfa6"/></radialGradient>')
    S.append(f'<path d="M 180 318 C 180 244 238 212 300 212 C 362 212 420 244 420 318 C 420 392 366 452 300 452 C 234 452 180 392 180 318 Z" fill="url(#skin)" stroke="{OUT}" stroke-width="3.5"/>')
    # tai + bông tai ngọc
    for sgn in (-1,1):
        x=300+sgn*121
        S.append(f'<ellipse cx="{x}" cy="352" rx="11" ry="16" fill="#ffdcc6" stroke="{OUT}" stroke-width="3"/>')
        S.append(f'<line x1="{x}" y1="366" x2="{x}" y2="378" stroke="#d9b36a" stroke-width="2.4"/><ellipse cx="{x}" cy="388" rx="5.5" ry="8" fill="#6ee0b4" stroke="{OUT}" stroke-width="2.2"/><ellipse cx="{x-1.5}" cy="385" rx="1.6" ry="2.6" fill="#fff" opacity=".85"/>')
    # má hồng
    S.append('<radialGradient id="blush"><stop offset="0" stop-color="#ff7fa0" stop-opacity=".7"/><stop offset="1" stop-color="#ff7fa0" stop-opacity="0"/></radialGradient>')
    S.append('<ellipse cx="226" cy="396" rx="30" ry="17" fill="url(#blush)"/><ellipse cx="374" cy="396" rx="30" ry="17" fill="url(#blush)"/>')
    S.append('<g stroke="#ff6f95" stroke-width="2.2" stroke-linecap="round" opacity=".7"><path d="M 212 392 l 5 8 M 222 391 l 5 8 M 232 392 l 5 8"/><path d="M 362 392 l 5 8 M 372 391 l 5 8 M 382 392 l 5 8"/></g>')
    # mắt
    S.append('<radialGradient id="iris" cx=".5" cy=".38" r=".7"><stop offset="0" stop-color="#9d7bf0"/><stop offset=".45" stop-color="#4b2f93"/><stop offset="1" stop-color="#1b0f3c"/></radialGradient>')
    eyes=[]
    for sgn in (-1,1):
        cx=300+sgn*56; cy=362
        eyes.append(f'<g transform="translate({cx} {cy})"><ellipse cx="0" cy="0" rx="27" ry="34" fill="#fff"/><ellipse cx="0" cy="3" rx="22" ry="29" fill="url(#iris)"/><ellipse cx="0" cy="5" rx="11" ry="15" fill="#120a2a"/><circle cx="{-8*sgn*-1 if False else -8}" cy="-8" r="9" fill="#fff"/><circle cx="9" cy="14" r="4.6" fill="#fff"/><circle cx="-12" cy="12" r="2.2" fill="#e6dcff" opacity=".9"/>'
                    f'<path d="M -29 -8 C -24 -34 24 -36 29 -8" fill="none" stroke="{OUT}" stroke-width="6" stroke-linecap="round"/>'
                    f'<path d="M {29*sgn} -8 q {9*sgn} -5 {12*sgn} -14" fill="none" stroke="{OUT}" stroke-width="5" stroke-linecap="round"/>'
                    f'<path d="M -20 32 C -8 38 8 38 20 32" fill="none" stroke="#c99a8a" stroke-width="1.8" opacity=".6"/></g>')
    S.append('<g id="eyes">'+''.join(eyes)+'</g>')
    # lông mày
    S.append(f'<path d="M 214 318 C 228 308 248 308 262 314" fill="none" stroke="#2b1e44" stroke-width="4.2" stroke-linecap="round"/><path d="M 338 314 C 352 308 372 308 386 318" fill="none" stroke="#2b1e44" stroke-width="4.2" stroke-linecap="round"/>')
    # mũi + miệng
    S.append('<path d="M 297 396 Q 300 400 303 396" fill="none" stroke="#d99a86" stroke-width="2.6" stroke-linecap="round"/>')
    S.append(f'<g id="mouth"><path d="M 282 410 Q 300 442 318 410 Q 300 418 282 410 Z" fill="#d6527a" stroke="{OUT}" stroke-width="2.8" stroke-linejoin="round"/><path d="M 290 422 Q 300 434 310 422 Q 300 426 290 422 Z" fill="#ff9db8"/><path d="M 286 412 Q 300 418 314 412" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".9"/></g>')
    # mái + tóc hai bên mặt
    # tóc mái thẳng ngang, mép dưới lượn sóng nhẹ
    S.append(f'<path id="bangs" d="M 176 332 C 170 262 226 220 300 220 C 374 220 430 262 424 332 C 420 314 410 304 398 301 Q 384 307 368 300 Q 352 294 334 301 Q 318 307 300 300 Q 282 307 266 301 Q 248 294 232 300 Q 216 307 202 301 C 190 304 180 314 176 332 Z" fill="url(#hairg2)" stroke="{OUT}" stroke-width="3.2" stroke-linejoin="round"/>')
    S.append('<g fill="none" stroke="#5a5a68" stroke-linecap="round"><path d="M 214 262 C 248 246 290 242 332 246" stroke-width="3.4" opacity=".7"/><path d="M 360 252 C 388 260 406 276 412 296" stroke-width="3" opacity=".55"/><path d="M 196 290 C 200 276 206 268 214 262" stroke-width="2.4" opacity=".5"/></g>')
    for sgn in (-1,1):
        x=300+sgn*124
        S.append(f'<path d="M {x} 300 C {x+sgn*14} 350 {x+sgn*8} 420 {x-sgn*14} 462 C {x-sgn*10} 410 {x-sgn*14} 350 {x-sgn*10} 306 Z" fill="url(#hairg)" stroke="{OUT}" stroke-width="3" stroke-linejoin="round"/>')
    S.append('<path d="M 214 262 C 236 246 262 240 284 244" fill="none" stroke="#5a5a68" stroke-width="4" stroke-linecap="round" opacity=".55"/>')
    # ===== nón lá =====
    S.append('<g transform="translate(0,-30)">'+hat()+'</g>')
    # dây quai tím + nơ dưới cằm
    for sgn in (-1,1):
        bx,by=bez(L,C,R,0.5+sgn*0.36); by-=30
        S.append(f'<path d="M {bx:.0f} {by:.0f} C {bx+sgn*(-6):.0f} {by+90:.0f} {300+sgn*86} 440 {300+sgn*14} 458" fill="none" stroke="{OUT}" stroke-width="9" stroke-linecap="round"/>')
        S.append(f'<path d="M {bx:.0f} {by:.0f} C {bx+sgn*(-6):.0f} {by+90:.0f} {300+sgn*86} 440 {300+sgn*14} 458" fill="none" stroke="#a97bf0" stroke-width="5" stroke-linecap="round"/>')
    S.append(f'<path d="M 300 462 C 270 440 258 478 280 484 C 292 486 298 474 300 462 C 302 474 308 486 320 484 C 342 478 330 440 300 462 Z" fill="#a97bf0" stroke="{OUT}" stroke-width="3" stroke-linejoin="round"/>')
    S.append(f'<path d="M 296 474 C 286 500 276 520 268 538 L 282 534 L 292 500 Z M 304 474 C 314 500 324 520 332 538 L 318 534 L 308 500 Z" fill="#8a57de" stroke="{OUT}" stroke-width="2.6" stroke-linejoin="round"/>')
    S.append(f'<circle cx="300" cy="466" r="7" fill="#8a57de" stroke="{OUT}" stroke-width="2.6"/>')
    # tay áo + bàn tay + quả cầu
    for sgn in (-1,1):
        x=300+sgn*58
        S.append(f'<path d="M {300+sgn*58} 478 C {300+sgn*96} 500 {300+sgn*92} 566 {300+sgn*34} 584 L {300+sgn*22} 556 C {300+sgn*56} 548 {300+sgn*58} 520 {300+sgn*40} 494 Z" fill="url(#adg2)" stroke="{OUT}" stroke-width="3.5" stroke-linejoin="round"/>')
        S.append(f'<path d="M {300+sgn*36} 584 L {300+sgn*22} 556" stroke="#f6d77a" stroke-width="4.5" stroke-linecap="round"/>')
    S.append('<radialGradient id="orbg" cx=".38" cy=".34" r=".75"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#ffe9a8"/><stop offset=".75" stop-color="#b48cf5"/><stop offset="1" stop-color="#6b3fc4"/></radialGradient>')
    S.append('<radialGradient id="halo"><stop offset="0" stop-color="#ffe9a8" stop-opacity=".85"/><stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/></radialGradient>')
    S.append('<g id="orb"><circle cx="300" cy="556" r="64" fill="url(#halo)"/><circle cx="300" cy="552" r="27" fill="url(#orbg)" stroke="#2a1a4d" stroke-width="3"/>'
             '<path d="M 288 548 a 13 13 0 1 0 14 -14 a 10 10 0 1 1 -14 14 Z" fill="#7a4fd0" opacity=".55"/>'
             '<circle cx="290" cy="542" r="6" fill="#fff" opacity=".9"/>'
             '<circle cx="300" cy="552" r="38" fill="none" stroke="#f6d77a" stroke-width="2" stroke-dasharray="3 5" opacity=".9"/></g>')
    for sgn in (-1,1):
        S.append(f'<ellipse cx="{300+sgn*26}" cy="574" rx="14" ry="12" fill="#ffdcc6" stroke="{OUT}" stroke-width="3"/><path d="M {300+sgn*22} 570 q {sgn*6} 2 {sgn*10} -2" stroke="#e8b59c" stroke-width="2" fill="none" stroke-linecap="round"/>')
    if with_veil: S.append(veil_front(anim))
    # lấp lánh + cánh sen rơi
    for (x,y,r,f) in [(92,170,16,'#fff6c9'),(520,150,12,'#e6dcff'),(80,430,10,'#fff6c9'),(528,440,16,'#fff6c9'),(150,120,8,'#e6dcff'),(470,96,9,'#fff6c9'),(60,600,9,'#e6dcff'),(548,610,10,'#fff6c9'),(430,520,7,'#fff6c9')]:
        S.append(sparkle(x,y,r,f))
    for (x,y,rot) in [(120,520,-30),(486,568,40),(66,300,20),(540,330,-25)]:
        S.append(f'<path d="M 0 0 C -8 -10 -6 -22 0 -30 C 6 -22 8 -10 0 0 Z" transform="translate({x} {y}) rotate({rot})" fill="#f9b2cf" stroke="{OUT}" stroke-width="2" stroke-linejoin="round" opacity=".95"/>')
    S.append(lotus(118,744,0.62)); S.append(lotus(486,748,0.55))
    return '\n'.join(S)

def svg(bg=False, veil=False, anim=False):
    head=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="600" height="800">\n<title>Huyền My — chibi áo dài tím, nón lá{" voan" if veil else ""}</title>\n<desc>Nhân vật Huyền My của ứng dụng Huyền My Luận Giải. Các nhóm có id: hat, hair-back, bangs, eyes, mouth, orb để làm hoạt họa.</desc>\n<defs></defs>\n'
    if bg:
        head+=('<defs><radialGradient id="bgg" cx=".5" cy=".42" r=".75"><stop offset="0" stop-color="#4a2f94"/><stop offset=".55" stop-color="#241552"/><stop offset="1" stop-color="#0c0824"/></radialGradient></defs>'
               '<rect width="600" height="800" rx="36" fill="url(#bgg)"/><circle cx="300" cy="330" r="215" fill="#e8dcff" opacity=".13"/><circle cx="300" cy="330" r="215" fill="none" stroke="#d6c2ff" stroke-width="2" opacity=".35"/>')
        for i in range(70):
            x=(i*137)%600; y=(i*251)%420; r=1+(i%3)*0.7
            head+=f'<circle cx="{x}" cy="{y}" r="{r}" fill="#fff" opacity="{0.25+(i%4)*0.18:.2f}"/>'
    css=''
    if anim:
        css=('<style>#eyes{transform-box:fill-box;transform-origin:center;animation:blink 4.6s infinite}'
             '@keyframes blink{0%,91%,100%{transform:scaleY(1)}94%{transform:scaleY(.08)}}'
             '#orb{animation:glow 3.2s ease-in-out infinite}@keyframes glow{50%{opacity:.62}}'
             '.sp{transform-box:fill-box;transform-origin:center;animation:tw 3.4s ease-in-out infinite}'
             '@keyframes tw{0%,100%{opacity:.25;transform:scale(.7)}50%{opacity:1;transform:scale(1.15)}}'
             '.tail{animation:fl 4.2s ease-in-out infinite}.tail.t2{animation-duration:5.1s;animation-delay:-1.2s}'
             '@keyframes fl{0%,100%{transform:rotate(-3deg) skewX(0deg)}50%{transform:rotate(5deg) skewX(-5deg)}}'
             '#mouth{transform-box:fill-box;transform-origin:center;animation:sm 5.5s ease-in-out infinite}@keyframes sm{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}'
             '@media (prefers-reduced-motion:reduce){*{animation:none!important}}</style>')
    return head+css+character(veil,anim)+'\n</svg>\n'

open(sys.argv[1]+'/huyenmy-v2.svg','w').write(svg(False,True))
open(sys.argv[1]+'/huyenmy-v2-nen.svg','w').write(svg(True,True))
open(sys.argv[1]+'/huyenmy-v2-dong.svg','w').write(svg(True,True,True))
print('ok')
