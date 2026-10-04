# Bộ sinh ảnh vector Huyền My (chibi, có bản voan). Chạy: python3 tools/chibi.py public/art
# Bộ sinh ảnh vector Huyền My (chibi). Chạy: python3 tools/chibi.py public/art
import math, sys

OUT = '#2a1a4d'   # nét viền tím than đậm
def bez(L, C, R, t): return ((1-t)**2*L[0]+2*(1-t)*t*C[0]+t*t*R[0], (1-t)**2*L[1]+2*(1-t)*t*C[1]+t*t*R[1])

A=(300,66); L=(82,256); R=(518,256); C=(300,300)   # nón lá
def hat():
    s=[]
    d=f"M {A[0]} {A[1]} C {A[0]-34} {A[1]+42} {L[0]+96} {L[1]-76} {L[0]} {L[1]} Q {C[0]} {C[1]} {R[0]} {R[1]} C {R[0]-96} {R[1]-76} {A[0]+34} {A[1]+42} {A[0]} {A[1]} Z"
    s.append(f'<clipPath id="hatclip"><path d="{d}"/></clipPath>')
    s.append('<linearGradient id="hatg" x1="0" y1="0" x2="1" y2="0.2"><stop offset="0" stop-color="#fbebbd"/><stop offset=".45" stop-color="#f0d38d"/><stop offset="1" stop-color="#d5ac5e"/></linearGradient>')
    s.append(f'<g id="hat"><path d="{d}" fill="url(#hatg)"/>')
    s.append('<g clip-path="url(#hatclip)" fill="none" stroke="#b58a3e" stroke-linecap="round">')
    for i in range(1,40):
        t=i/40; bx,by=bez(L,C,R,t)
        s.append(f'<line x1="{A[0]}" y1="{A[1]}" x2="{bx:.1f}" y2="{by:.1f}" stroke-width="1.3" opacity=".42"/>')
    for k in range(1,9):
        f=k/9; l=(A[0]+f*(L[0]-A[0]),A[1]+f*(L[1]-A[1])); c=(A[0]+f*(C[0]-A[0]),A[1]+f*(C[1]-A[1])); r=(A[0]+f*(R[0]-A[0]),A[1]+f*(R[1]-A[1]))
        s.append(f'<path d="M {l[0]:.1f} {l[1]:.1f} Q {c[0]:.1f} {c[1]:.1f} {r[0]:.1f} {r[1]:.1f}" stroke-width="2" opacity=".5"/>')
    s.append('</g>')
    # vệt sáng
    s.append(f'<path d="M 300 {A[1]+12} C 268 {A[1]+50} 210 {A[1]+104} 160 {A[1]+158} C 196 {A[1]+110} 250 {A[1]+54} 300 {A[1]+12} Z" fill="#fffbe8" opacity=".55"/>')
    # vành tre
    s.append(f'<path d="M {L[0]} {L[1]} Q {C[0]} {C[1]} {R[0]} {R[1]}" fill="none" stroke="#c99c4c" stroke-width="7" stroke-linecap="round"/>')
    s.append(f'<path d="M {L[0]} {L[1]} Q {C[0]} {C[1]} {R[0]} {R[1]}" fill="none" stroke="#fff3c8" stroke-width="2" opacity=".6" transform="translate(0,-1.5)"/>')
    s.append(f'<path d="{d}" fill="none" stroke="{OUT}" stroke-width="3.5" stroke-linejoin="round"/>')
    # nơ tím trang trí đỉnh nón + dải lụa
    s.append(f'<path d="M 300 {A[1]} C 288 {A[1]-8} 280 {A[1]+4} 292 {A[1]+10} C 296 {A[1]+4} 298 {A[1]+2} 300 {A[1]} C 302 {A[1]+2} 304 {A[1]+4} 308 {A[1]+10} C 320 {A[1]+4} 312 {A[1]-8} 300 {A[1]} Z" fill="#9a6ae8" stroke="#2a1a4d" stroke-width="2.5" stroke-linejoin="round"/>')
    s.append(f'<circle cx="300" cy="{A[1]+3}" r="4.5" fill="#f6d77a" stroke="#2a1a4d" stroke-width="1.8"/>')
    s.append('</g>')
    return '\n'.join(s)

def sparkle(x,y,r,fill='#fff6c9',op=1):
    return f'<path d="M {x} {y-r} Q {x} {y} {x+r} {y} Q {x} {y} {x} {y+r} Q {x} {y} {x-r} {y} Q {x} {y} {x} {y-r} Z" fill="{fill}" opacity="{op}"/>'
def flower(cx,cy,r,fill='#f7d56e',op=1):
    s=[]
    for i in range(5):
        a=i*72-90
        px=cx+math.cos(math.radians(a))*r*0.9; py=cy+math.sin(math.radians(a))*r*0.9
        s.append(f'<ellipse cx="{px:.1f}" cy="{py:.1f}" rx="{r*0.55:.1f}" ry="{r*0.8:.1f}" transform="rotate({a+90} {px:.1f} {py:.1f})" fill="{fill}" opacity="{op}"/>')
    s.append(f'<circle cx="{cx}" cy="{cy}" r="{r*0.35:.1f}" fill="#fff3b0" opacity="{op}"/>')
    return ''.join(s)
def lotus(cx,cy,s=1.0):
    p=[]
    for ang,col in [(-62,'#f48fb6'),(62,'#f48fb6'),(-32,'#f9b2cf'),(32,'#f9b2cf'),(0,'#ffd0e2')]:
        p.append(f'<path d="M 0 0 C -14 -16 -10 -40 0 -54 C 10 -40 14 -16 0 0 Z" transform="rotate({ang})" fill="{col}" stroke="{OUT}" stroke-width="2.4" stroke-linejoin="round"/>')
    return f'<g transform="translate({cx} {cy}) scale({s})">'+''.join(p)+'<ellipse cx="0" cy="2" rx="22" ry="6" fill="#7bc79a" stroke="#2a1a4d" stroke-width="2"/></g>'


def scallop(x0, x1, y, n, depth=12):
    """Mép dưới lượn sóng đi từ x0 đến x1 (có thể ngược chiều); trả về (path, các đỉnh)."""
    pts=[]; d=''
    step=(x1-x0)/n
    for i in range(n):
        xa=x0+i*step; xb=xa+step
        d+=f' Q {(xa+xb)/2:.1f} {y+depth*2:.1f} {xb:.1f} {y:.1f}'
        pts.append((xb,y))
    return d, pts

def veil_defs():
    return ('<linearGradient id="voan" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#dffff0" stop-opacity=".78"/><stop offset=".5" stop-color="#cfd8ff" stop-opacity=".7"/><stop offset="1" stop-color="#ecd0ff" stop-opacity=".78"/></linearGradient>'
            '<linearGradient id="voan2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8fff6" stop-opacity=".42"/><stop offset="1" stop-color="#d6d4ff" stop-opacity=".5"/></linearGradient>'
            '<linearGradient id="voanf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1fff9" stop-opacity=".30"/><stop offset="1" stop-color="#e3dcff" stop-opacity=".22"/></linearGradient>')

def veil_back():
    """Voan phía sau: rủ rộng từ vành nón, thấy rõ ở hai bên tóc."""
    b0=bez(L,C,R,0.04); b1=bez(L,C,R,0.96)
    hy=690
    sc,pts=scallop(b1[0]+62, b0[0]-62, hy, 9, 12)
    d=f'M {b0[0]:.0f} {b0[1]:.0f} C {b0[0]-46} 380 {b0[0]-74} 560 {b0[0]-62} {hy} {sc.replace("M","L")} '
    # đi từ phải về trái nên ghép: phải trước
    d=f'M {b0[0]:.0f} {b0[1]:.0f} C {b0[0]-50} 380 {b0[0]-76} 560 {b0[0]-64} {hy}'
    # mép dưới từ trái sang phải
    sc2,pts2=scallop(b0[0]-64, b1[0]+64, hy, 9, 12)
    d+=sc2+f' C {b1[0]+76} 560 {b1[0]+50} 380 {b1[0]:.0f} {b1[1]:.0f} Z'
    out=[f'<g id="voan-sau"><path d="{d}" fill="url(#voan2)" stroke="#f4eeff" stroke-opacity=".7" stroke-width="2.2" stroke-linejoin="round"/>']
    # nếp gấp
    for i in range(1,8):
        t=i/8; tx=b0[0]+(b1[0]-b0[0])*t; hx=(b0[0]-64)+((b1[0]+64)-(b0[0]-64))*t
        out.append(f'<path d="M {tx:.0f} {bez(L,C,R,0.04+0.92*t)[1]:.0f} C {tx+(hx-tx)*0.2:.0f} 420 {tx+(hx-tx)*0.6:.0f} 560 {hx:.0f} {hy+8}" fill="none" stroke="#ffffff" stroke-opacity="{0.28 if i%2 else 0.16}" stroke-width="2.4" stroke-linecap="round"/>')
    for (x,y) in pts2: out.append(f'<circle cx="{x:.0f}" cy="{y+1:.0f}" r="3.6" fill="#fff" stroke="#bfb2e8" stroke-width="1.2" opacity=".95"/>')
    out.append('</g>'); return ''.join(out)

def veil_front():
    """Voan trước: hai tà thon dần rủ hai bên khung mặt (hở ngực áo); giữa mặt chỉ một lớp mỏng đến cằm."""
    out=['<g id="voan-truoc">']
    hy=648
    for mirror in (False, True):
        X=(lambda x: 600-x) if mirror else (lambda x: x)
        t0,t1=(0.0,0.25)
        a=bez(L,C,R,t0); b=bez(L,C,R,t1)
        ax,ay=X(a[0]),a[1]; bx,by=X(b[0]),b[1]
        ix,ox=X(166),X(58)
        # mép dưới lượn sóng từ trong ra ngoài
        n=4; step=(ox-ix)/n; sc=''; pts=[]
        for i in range(n):
            xa=ix+i*step; xb=xa+step; sc+=f' Q {(xa+xb)/2:.1f} {hy+20} {xb:.1f} {hy}'; pts.append((xb,hy))
        d=(f'M {ax:.0f} {ay:.0f} L {bx:.0f} {by:.0f} C {X(b[0]-4):.0f} 400 {X(184):.0f} 520 {ix:.0f} {hy}'+sc+
           f' C {X(50):.0f} 520 {X(56):.0f} 380 {ax:.0f} {ay+6:.0f} Z')
        out.append(f'<path d="{d}" fill="url(#voan)" stroke="#f6f0ff" stroke-opacity=".85" stroke-width="2.4" stroke-linejoin="round"/>')
        for i in range(1,5):
            f=i/5; tx=ax+(bx-ax)*f; hx=ox+(ix-ox)*(1-f) if False else ox+(ix-ox)*f
            ctrl=tx+(hx-tx)*0.1
            out.append(f'<path d="M {tx:.0f} {ay+(by-ay)*f:.0f} C {ctrl:.0f} 400 {tx+(hx-tx)*0.55:.0f} 520 {hx:.0f} {hy+8}" fill="none" stroke="#fff" stroke-opacity="{0.5 if i%2 else 0.28}" stroke-width="2.2" stroke-linecap="round"/>')
        for (x,y) in pts: out.append(f'<circle cx="{x:.0f}" cy="{y+1:.0f}" r="3.6" fill="#fff" stroke="#bfb2e8" stroke-width="1.2"/>')
    # lớp mỏng trước mặt: gần như trong suốt, đến cằm
    a=bez(L,C,R,0.25); b=bez(L,C,R,0.75)
    fy=458
    n=6; x0=b[0]-10; x1=a[0]+10; step=(x1-x0)/n; sc=''; pts=[]
    for i in range(n):
        xa=x0+i*step; xb=xa+step; sc+=f' Q {(xa+xb)/2:.1f} {fy+18} {xb:.1f} {fy}'; pts.append((xb,fy))
    d=f'M {a[0]:.0f} {a[1]:.0f} L {b[0]:.0f} {b[1]:.0f} L {x0:.0f} {fy}'+sc+' Z'
    out.append(f'<path d="{d}" fill="#f4f0ff" fill-opacity=".10" stroke="#fff" stroke-opacity=".5" stroke-width="1.6" stroke-linejoin="round"/>')
    out.append('<path d="M 262 288 C 264 350 260 410 258 452 M 338 288 C 336 350 340 410 342 452" fill="none" stroke="#fff" stroke-opacity=".2" stroke-width="2" stroke-linecap="round"/>')
    for (x,y) in pts: out.append(f'<circle cx="{x:.0f}" cy="{y+1:.0f}" r="2.4" fill="#fff" opacity=".9"/>')
    out.append('</g>'); return ''.join(out)

def character(with_veil=False):
    S=[]
    # bóng dưới chân
    S.append('<ellipse cx="300" cy="768" rx="150" ry="16" fill="#1c1040" opacity=".28"/>')
    if with_veil: S.append(veil_defs()); S.append(veil_back())
    # tóc sau
    S.append('<linearGradient id="hairg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a2f66"/><stop offset=".5" stop-color="#1a1330"/><stop offset="1" stop-color="#0d0a1c"/></linearGradient>')
    S.append(f'<path id="hair-back" d="M 186 292 C 150 380 154 520 186 596 C 208 640 244 624 254 580 L 346 580 C 356 624 392 640 414 596 C 446 520 450 380 414 292 Z" fill="url(#hairg)" stroke="{OUT}" stroke-width="3.5" stroke-linejoin="round"/>')
    S.append('<path d="M 172 410 C 166 470 172 540 190 586" fill="none" stroke="#7a68c0" stroke-width="3.5" stroke-linecap="round" opacity=".45"/><path d="M 428 410 C 434 470 428 540 410 586" fill="none" stroke="#7a68c0" stroke-width="3.5" stroke-linecap="round" opacity=".45"/>')
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
    for (x,y,r) in [(232,640,9),(214,682,7),(262,676,8),(344,636,9),(334,690,8),(372,676,7),(284,604,6),(318,598,6)]:
        S.append(flower(x,y,r,'#f6d77a',.95))
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
    S.append(f'<path id="bangs" d="M 176 316 C 172 250 232 204 300 204 C 368 204 428 250 424 316 Q 416 304 408 302 Q 398 306 394 326 Q 384 306 368 304 Q 354 306 348 324 Q 340 304 324 302 Q 308 304 300 322 Q 292 304 276 302 Q 260 304 252 324 Q 244 304 230 304 Q 216 306 206 326 Q 202 308 190 304 Q 182 306 176 316 Z" fill="url(#hairg)" stroke="{OUT}" stroke-width="3.2" stroke-linejoin="round"/>')
    S.append('<path d="M 232 250 C 256 238 280 234 300 236" fill="none" stroke="#9c8ae0" stroke-width="4" stroke-linecap="round" opacity=".5"/>')
    for sgn in (-1,1):
        x=300+sgn*124
        S.append(f'<path d="M {x} 300 C {x+sgn*14} 350 {x+sgn*8} 420 {x-sgn*14} 462 C {x-sgn*10} 410 {x-sgn*14} 350 {x-sgn*10} 306 Z" fill="url(#hairg)" stroke="{OUT}" stroke-width="3" stroke-linejoin="round"/>')
    S.append('<path d="M 214 262 C 236 246 262 240 284 244" fill="none" stroke="#8f7cd8" stroke-width="4" stroke-linecap="round" opacity=".55"/>')
    # ===== nón lá =====
    S.append(hat())
    # dây quai tím + nơ dưới cằm
    for sgn in (-1,1):
        bx,by=bez(L,C,R,0.5+sgn*0.36)
        S.append(f'<path d="M {bx:.0f} {by:.0f} C {bx+sgn*(-6):.0f} {by+90:.0f} {300+sgn*86} 440 {300+sgn*14} 458" fill="none" stroke="{OUT}" stroke-width="9" stroke-linecap="round"/>')
        S.append(f'<path d="M {bx:.0f} {by:.0f} C {bx+sgn*(-6):.0f} {by+90:.0f} {300+sgn*86} 440 {300+sgn*14} 458" fill="none" stroke="#a97bf0" stroke-width="5" stroke-linecap="round"/>')
    S.append(f'<path d="M 300 462 C 270 440 258 478 280 484 C 292 486 298 474 300 462 C 302 474 308 486 320 484 C 342 478 330 440 300 462 Z" fill="#a97bf0" stroke="{OUT}" stroke-width="3" stroke-linejoin="round"/>')
    S.append(f'<path d="M 296 474 C 286 500 276 520 268 538 L 282 534 L 292 500 Z M 304 474 C 314 500 324 520 332 538 L 318 534 L 308 500 Z" fill="#8a57de" stroke="{OUT}" stroke-width="2.6" stroke-linejoin="round"/>')
    S.append(f'<circle cx="300" cy="466" r="7" fill="#8a57de" stroke="{OUT}" stroke-width="2.6"/>')
    if with_veil: S.append(veil_front())
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
    # lấp lánh + cánh sen rơi
    for (x,y,r,f) in [(92,170,16,'#fff6c9'),(520,150,12,'#e6dcff'),(80,430,10,'#fff6c9'),(528,440,16,'#fff6c9'),(150,120,8,'#e6dcff'),(470,96,9,'#fff6c9'),(60,600,9,'#e6dcff'),(548,610,10,'#fff6c9'),(430,520,7,'#fff6c9')]:
        S.append(sparkle(x,y,r,f))
    for (x,y,rot) in [(120,520,-30),(486,568,40),(66,300,20),(540,330,-25)]:
        S.append(f'<path d="M 0 0 C -8 -10 -6 -22 0 -30 C 6 -22 8 -10 0 0 Z" transform="translate({x} {y}) rotate({rot})" fill="#f9b2cf" stroke="{OUT}" stroke-width="2" stroke-linejoin="round" opacity=".95"/>')
    S.append(lotus(118,744,0.62)); S.append(lotus(486,748,0.55))
    return '\n'.join(S)

def svg(bg=False, veil=False):
    head=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="600" height="800">\n<title>Huyền My — chibi áo dài tím, nón lá{" voan" if veil else ""}</title>\n<desc>Nhân vật Huyền My của ứng dụng Huyền My Luận Giải. Các nhóm có id: hat, hair-back, bangs, eyes, mouth, orb để làm hoạt họa.</desc>\n<defs></defs>\n'
    if bg:
        head+=('<defs><radialGradient id="bgg" cx=".5" cy=".42" r=".75"><stop offset="0" stop-color="#4a2f94"/><stop offset=".55" stop-color="#241552"/><stop offset="1" stop-color="#0c0824"/></radialGradient></defs>'
               '<rect width="600" height="800" rx="36" fill="url(#bgg)"/><circle cx="300" cy="330" r="215" fill="#e8dcff" opacity=".13"/><circle cx="300" cy="330" r="215" fill="none" stroke="#d6c2ff" stroke-width="2" opacity=".35"/>')
        for i in range(70):
            x=(i*137)%600; y=(i*251)%420; r=1+(i%3)*0.7
            head+=f'<circle cx="{x}" cy="{y}" r="{r}" fill="#fff" opacity="{0.25+(i%4)*0.18:.2f}"/>'
    return head+character(veil)+'\n</svg>\n'

open(sys.argv[1]+'/huyenmy-chibi-voan.svg','w').write(svg(False,True))
open(sys.argv[1]+'/huyenmy-chibi.svg','w').write(svg(False))
open(sys.argv[1]+'/huyenmy-chibi-voan-nen.svg','w').write(svg(True,True))
open(sys.argv[1]+'/huyenmy-chibi-nen.svg','w').write(svg(True))
print('ok')
