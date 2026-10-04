# Bộ sinh "rig" Huyền My: một tệp SVG có các bộ phận điều khiển được (mắt, mày, miệng, má, tay, đầu, hiệu ứng).
# Chạy: python3 tools/rig.py src/assets/huyenmy-rig.svg
import math, sys, re
src = open(__file__.replace('rig.py', 'chibi.py'), encoding='utf-8').read()
ns = {}
exec(src[:src.index("d=sys.argv[1]")], ns)           # dùng lại nón, voan, sen, hoa sen, sparkle từ bản vẽ đã chốt
OUT, bez, hat, sen, lotus, sparkle = ns['OUT'], ns['bez'], ns['hat'], ns['sen'], ns['lotus'], ns['sparkle']
veil_defs, veil_back, veil_front, L, C, R = ns['veil_defs'], ns['veil_back'], ns['veil_front'], ns['L'], ns['C'], ns['R']

EYES   = ['open', 'wide', 'surprised', 'happy', 'closed', 'half', 'sad', 'tender', 'teary', 'wink']
BROWS  = ['neutral', 'up', 'soft', 'worried', 'sad', 'furrow', 'raise', 'flat', 'relaxed']
MOUTHS = ['smile', 'smile-closed', 'grin', 'o', 'frown', 'flat', 'wavy', 'smirk', 'cat', 'tongue']
POSES  = ['hold', 'heart', 'clasp', 'open', 'chin', 'cheer', 'fist', 'cheeks']
FX     = ['sparkle', 'tear', 'sweat', 'hearts', 'think', 'shock', 'glow', 'shy']

def css():
    r = []
    r.append('.hm{--gx:0px;--gy:0px}')
    r.append('.hm *{transition:opacity .18s ease}')
    r.append('.hm .eye{transform-box:fill-box;transform-origin:center;transition:transform .16s ease,opacity .18s}')
    r.append('.hm .e-base{transform-box:fill-box;transform-origin:50% 50%;transition:transform .09s ease,opacity .18s}')
    r.append('.hm.blink .e-base{transform:scaleY(.08)}')
    r.append('.hm .pupil-g{transform:translate(var(--gx),var(--gy));transition:transform .22s ease-out}')
    r.append('.hm .e-happy,.hm .e-closed,.hm .lid,.hm .star-hl,.hm .glint{opacity:0}')
    r.append('.hm[data-eyes="happy"] .e-base,.hm[data-eyes="closed"] .e-base{opacity:0}')
    r.append('.hm[data-eyes="happy"] .e-happy{opacity:1}.hm[data-eyes="closed"] .e-closed{opacity:1}')
    r.append('.hm[data-eyes="wink"] .eye-r .e-base{opacity:0}.hm[data-eyes="wink"] .eye-r .e-happy{opacity:1}')
    r.append('.hm[data-eyes="wide"] .eye{transform:scale(1.12)}.hm[data-eyes="surprised"] .eye{transform:scale(1.22)}')
    r.append('.hm .water,.hm .bead{opacity:0}.hm[data-eyes="teary"] .water,.hm[data-eyes="teary"] .bead,.hm[data-eyes="teary"] .glint{opacity:1}')
    r.append('.hm[data-eyes="teary"] .water{animation:hm-quiver 1.3s ease-in-out infinite;transform-box:fill-box;transform-origin:center}@keyframes hm-quiver{50%{transform:scale(1.05,1.12)}}')
    r.append('.hm[data-eyes="teary"] .bead{animation:hm-bead 3.2s ease-in infinite}@keyframes hm-bead{0%,60%{transform:translateY(0)}100%{transform:translateY(5px)}}')
    r.append('.hm[data-eyes="wide"] .star-hl{opacity:1}')
    r.append('.hm[data-eyes="surprised"] .pupil{transform:scale(.55);transform-box:fill-box;transform-origin:center}')
    r.append('.hm[data-eyes="half"] .lid-half,.hm[data-eyes="sad"] .lid-sad,.hm[data-eyes="tender"] .lid-tender{opacity:1}')
    r.append('.hm[data-eyes="sad"] .glint,.hm[data-eyes="tender"] .glint{opacity:1}')
    for g, vs in (('b', BROWS), ('m', MOUTHS), ('pose', POSES)):
        r.append(f'.hm .{g}{{opacity:0}}' if g != 'pose' else '.hm .pose{opacity:0}')
        attr = {'b': 'brows', 'm': 'mouth', 'pose': 'pose'}[g]
        for v in vs: r.append(f'.hm[data-{attr}="{v}"] .{g}-{v}{{opacity:1}}')
    r.append('.hm .m-talk{opacity:0;transform-box:fill-box;transform-origin:50% 25%;transform:scale(var(--mw,1),var(--mo,.3));transition:transform .05s linear}')
    r.append('.hm.speaking .m{opacity:0!important}.hm.speaking .m-talk{opacity:1}')
    r.append('.hm .blush{opacity:.7;transform-box:fill-box;transform-origin:center}')
    r.append('.hm[data-blush="s"] .blush{opacity:.92;transform:scale(1.1)}.hm[data-blush="x"] .blush{opacity:1;transform:scale(1.25)}')
    r.append('.hm .fx{opacity:0}')
    for f in FX: r.append(f'.hm[data-fx~="{f}"] .fx-{f}{{opacity:1}}')
    r.append('.hm .fx-tear .drop{animation:hm-tear 2.6s ease-in infinite}.hm .fx-tear .drop+.drop{animation-delay:-1.1s}')
    r.append('@keyframes hm-tear{0%{transform:translateY(0);opacity:0}15%{opacity:.95}85%{opacity:.9}100%{transform:translateY(30px);opacity:0}}')
    r.append('.hm .fx-sweat .drop{animation:hm-sweat 3s ease-in-out infinite}@keyframes hm-sweat{0%,100%{transform:translateY(0)}50%{transform:translateY(8px)}}')
    r.append('.hm .fx-sparkle .sp{transform-box:fill-box;transform-origin:center;animation:hm-tw 1.8s ease-in-out infinite}')
    for i in range(8): r.append(f'.hm .fx-sparkle .sp:nth-child({i+1}){{animation-delay:{i*0.23:.2f}s}}')
    r.append('@keyframes hm-tw{0%,100%{transform:scale(.4);opacity:.3}50%{transform:scale(1.2);opacity:1}}')
    r.append('.hm .fx-hearts .ht{animation:hm-heart 3.2s ease-out infinite}')
    for i in range(5): r.append(f'.hm .fx-hearts .ht:nth-child({i+1}){{animation-delay:{i*0.62:.2f}s}}')
    r.append('@keyframes hm-heart{0%{transform:translateY(24px) scale(.5);opacity:0}25%{opacity:1}100%{transform:translateY(-70px) scale(1);opacity:0}}')
    r.append('.hm .fx-think circle{animation:hm-think 1.8s ease-in-out infinite}.hm .fx-think circle:nth-child(2){animation-delay:.3s}.hm .fx-think circle:nth-child(3){animation-delay:.6s}')
    r.append('@keyframes hm-think{0%,100%{opacity:.25}40%{opacity:1}}')
    r.append('.hm .fx-shock path{animation:hm-shock .5s ease-out infinite alternate}@keyframes hm-shock{from{opacity:.4}to{opacity:1}}')
    r.append('.hm .fx-glow{animation:hm-glow 2.6s ease-in-out infinite}@keyframes hm-glow{50%{transform:scale(1.12)}}.hm .fx-glow{transform-box:fill-box;transform-origin:center}')
    r.append('.hm .tail{animation:hm-fl 4.2s ease-in-out infinite}.hm .tail.t2{animation-duration:5.1s;animation-delay:-1.2s}')
    r.append('@keyframes hm-fl{0%,100%{transform:rotate(-3deg) skewX(0deg)}50%{transform:rotate(5deg) skewX(-5deg)}}')
    r.append('.hm .sp0{animation:hm-tw 3.4s ease-in-out infinite;transform-box:fill-box;transform-origin:center}')
    r.append('@media (prefers-reduced-motion:reduce){.hm *{animation:none!important}}')
    return '\n'.join(r)

# ---------- tay: nét viền liền mạch (vai, khuỷu bo tròn), bàn tay có ngón ----------
SK = '#ffdcc6'; SLEEVE = '#8b5fe0'; SHADE = '#e8b59c'
def seg(P, Q, w):
    """Một đoạn tay: nét viền tím đậm bên dưới, thân áo tím bên trên, đầu bo tròn nên nối khớp liền mạch."""
    d = f'M {P[0]} {P[1]} L {Q[0]} {Q[1]}'
    return d, (f'<path d="{d}" stroke="{OUT}" stroke-width="{w + 6.6}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
               f'<path d="{d}" stroke="{SLEEVE}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'
               f'<path d="{d}" stroke="#b49cf3" stroke-width="{w * 0.34:.1f}" stroke-linecap="round" fill="none" opacity=".55" transform="translate(-2.2 -1.6)"/>')
def cuff(E, W, w):
    dx, dy = W[0] - E[0], W[1] - E[1]; ln = math.hypot(dx, dy) or 1; nx, ny = -dy / ln, dx / ln; r = w / 2 + 1.5
    return f'<path d="M {W[0] + nx * r:.1f} {W[1] + ny * r:.1f} L {W[0] - nx * r:.1f} {W[1] - ny * r:.1f}" stroke="#f6d77a" stroke-width="5" stroke-linecap="round"/>'

def _fing(x, y, ang, ln, wd):
    r = wd / 2
    return f'<rect x="{-r}" y="{-ln}" width="{wd}" height="{ln + r}" rx="{r}" ry="{r}" transform="translate({x} {y}) rotate({ang})" fill="{SK}" stroke="{OUT}" stroke-width="2.3"/>'
PALM = f'<path d="M -11 -2 C -12 -11 -10 -15 -9 -16 L 9 -16 C 10 -15 12 -11 11 -2 C 10 6 -10 6 -11 -2 Z" fill="{SK}" stroke="{OUT}" stroke-width="2.4" stroke-linejoin="round"/>'
KNUCK = f'<path d="M -5 -15 v 3.5 M 0.2 -15.5 v 4 M 5.4 -15 v 3.5" stroke="{SHADE}" stroke-width="1.6" stroke-linecap="round" fill="none"/>'
def hand(kind, x, y, rot=0, flip=False, sc=1.32):
    """Bàn tay có ngón. Gốc cổ tay ở (0,0), ngón chỉ lên (-y); flip = tay còn lại."""
    g = f'<g transform="translate({x} {y}) rotate({rot}) scale({-sc if flip else sc} {sc})">'
    if kind == 'flat':      # các ngón khép
        g += ''.join(_fing(fx, -12, 0, fl, 5.3) for fx, fl in [(-7.6, 12), (-2.6, 14.5), (2.7, 13.5), (7.8, 10.5)])
        g += _fing(-11, -2, -40, 10.5, 6.4) + PALM + KNUCK
    elif kind == 'spread':  # xòe năm ngón (reo, mở lòng bàn tay)
        g += ''.join(_fing(fx, -13, an, fl, 5.3) for fx, an, fl in [(-8, -24, 11), (-3, -9, 14.5), (3, 7, 13.5), (8, 22, 10.5)])
        g += _fing(-11, -2, -52, 10.5, 6.4) + PALM + KNUCK
    elif kind == 'fist':    # nắm tay: bốn ngón cuộn, ngón cái vắt ngang
        g += (f'<path d="M -11 -4 C -13 -14 -9 -21 0 -21 C 9 -21 13 -14 11 -4 C 10 4 -10 4 -11 -4 Z" fill="{SK}" stroke="{OUT}" stroke-width="2.4" stroke-linejoin="round"/>'
              f'<path d="M -5.6 -19.5 v 10 M 0 -20.5 v 11 M 5.6 -19.5 v 10" stroke="{SHADE}" stroke-width="1.9" stroke-linecap="round" fill="none"/>'
              f'<rect x="-12" y="-10" width="23" height="6.6" rx="3.3" transform="rotate(-8)" fill="{SK}" stroke="{OUT}" stroke-width="2.2"/>')
    elif kind == 'point':   # chống cằm: ngón trỏ duỗi, ba ngón còn lại cuộn
        g += _fing(-5.4, -17, -4, 14, 5.4) + (f'<path d="M -11 -4 C -13 -13 -9 -19 -2 -19 C 7 -19 13 -14 11 -4 C 10 4 -10 4 -11 -4 Z" fill="{SK}" stroke="{OUT}" stroke-width="2.4" stroke-linejoin="round"/>'
              f'<path d="M 0 -18 v 9 M 5.8 -17 v 8" stroke="{SHADE}" stroke-width="1.8" stroke-linecap="round" fill="none"/>'
              f'<rect x="-12" y="-9" width="22" height="6.4" rx="3.2" transform="rotate(-8)" fill="{SK}" stroke="{OUT}" stroke-width="2.2"/>')
    return g + '</g>'

def mir(P): return (600 - P[0], P[1])
SH_L, SH_R = (244, 482), (356, 482)
# mỗi tay: (khuỷu, cổ tay, kiểu bàn tay, góc xoay, lật?)
def L_(E, W, kind, rot, flip=False): return (SH_L, E, W, kind, rot, flip)
def R_(E, W, kind, rot, flip=True): return (SH_R, E, W, kind, rot, flip)
HOLD_L = L_((212, 548), (268, 584), 'flat', 42, False)
HOLD_R = R_((388, 548), (332, 584), 'flat', -42, True)
POSE_SPECS = {
    'hold':   (HOLD_L, HOLD_R),
    'heart':  (L_((212, 538), (280, 514), 'flat', 76, False), R_((390, 542), (318, 524), 'flat', -76, True)),
    'clasp':  (L_((216, 546), (290, 534), 'flat', 80, False), R_((384, 546), (310, 534), 'flat', -80, True)),
    'open':   (L_((204, 536), (176, 574), 'spread', -36, False), R_((396, 536), (424, 574), 'spread', 36, True)),
    'chin':   (HOLD_L, R_((408, 520), (366, 464), 'point', -58, True)),
    'cheer':  (L_((194, 502), (190, 434), 'spread', -8, False), R_((406, 502), (410, 434), 'spread', 8, True)),
    'fist':   (HOLD_L, R_((414, 506), (398, 442), 'fist', 8, True)),
    'cheeks': (L_((206, 476), (236, 430), 'flat', -14, False), R_((394, 476), (364, 430), 'flat', 14, True)),
}
def poses():
    """Trả về (nhóm tay phía sau thân: vai + cánh tay trên, nhóm tay phía trước: cẳng tay + bàn tay)."""
    back, front = [], []
    for name in POSES:
        gb, gf = f'<g class="pose pose-{name}">', f'<g class="pose pose-{name}">'
        for (S, E, W, kind, rot, flip) in POSE_SPECS[name]:
            _, (o1, f1) = seg(S, E, 29); gb += o1 + f1
            _, (o2, f2) = seg(E, W, 22); gf += o2 + f2 + cuff(E, W, 22)
        for (S, E, W, kind, rot, flip) in POSE_SPECS[name]:
            gf += hand(kind, W[0], W[1], rot, flip)
        if name == 'clasp':   # hai bàn tay đan vào nhau
            gf += f'<ellipse cx="300" cy="535" rx="9" ry="6" fill="{SK}" stroke="{OUT}" stroke-width="2.2"/>'
        back.append(gb + '</g>'); front.append(gf + '</g>')
    return '\n'.join(back), '\n'.join(front)

# ---------- mắt ----------
def eye(sgn):
    cx = 300 + sgn * 56; side = 'eye-l' if sgn < 0 else 'eye-r'
    y_out, y_in = 8, -14
    def lid(y_o, y_i, stroke=True, sx=32):
        yl = y_o if sgn < 0 else y_i; yr = y_i if sgn < 0 else y_o
        d = f'M -{sx} -44 L {sx} -44 L {sx} {yr} Q 0 {(yl + yr) / 2 + 9} -{sx} {yl} Z'
        edge = f'M -{sx} {yl} Q 0 {(yl + yr) / 2 + 9} {sx} {yr}'
        return f'<path d="{d}" fill="#ffe3cf"/><path d="{edge}" fill="none" stroke="{OUT}" stroke-width="6" stroke-linecap="round"/>'
    return (f'<g transform="translate({cx} 362)"><g class="eye {side}">'
            f'<clipPath id="ec{side}"><ellipse cx="0" cy="0" rx="27" ry="34"/></clipPath>'
            '<g class="e-base"><ellipse cx="0" cy="0" rx="27" ry="34" fill="#fff"/>'
            f'<g clip-path="url(#ec{side})"><g class="pupil-g"><ellipse cx="0" cy="3" rx="22" ry="29" fill="url(#iris)"/><ellipse class="pupil" cx="0" cy="5" rx="11" ry="15" fill="#120a2a"/></g></g>'
            '<circle cx="-8" cy="-8" r="9" fill="#fff"/><circle cx="9" cy="14" r="4.6" fill="#fff"/><circle cx="-12" cy="12" r="2.2" fill="#e6dcff" opacity=".9"/>'
            '<g class="star-hl"><path d="M -8 -22 L -4 -12 L 6 -8 L -4 -4 L -8 6 L -12 -4 L -22 -8 L -12 -12 Z" fill="#fff"/><circle cx="12" cy="10" r="5" fill="#fff"/></g>'
            f'<g class="lid lid-half">{lid(-4, -4)}</g><g class="lid lid-sad">{lid(y_out, y_in)}</g><g class="lid lid-tender">{lid(0, -9)}</g>'
            '<ellipse class="glint" cx="-2" cy="22" rx="14" ry="6" fill="#fff" opacity=".7"/>'
            '<g class="water"><path d="M -25 16 Q 0 44 25 16 Q 0 31 -25 16 Z" fill="#cfeaff" opacity=".8"/><ellipse cx="0" cy="25" rx="18" ry="5" fill="#fff" opacity=".7"/><circle cx="13" cy="-1" r="4" fill="#fff"/><circle cx="-14" cy="6" r="2.6" fill="#fff" opacity=".9"/></g>'
            f'<g class="bead" transform="translate({sgn * 17} 31)"><path d="M 0 0 C -5 7 -6 12 0 15 C 6 12 5 7 0 0 Z" fill="#c9e9ff" stroke="#7ab8ff" stroke-width="1.8"/><ellipse cx="-1.5" cy="9" rx="1.4" ry="2.4" fill="#fff"/></g>'
            f'<path d="M -29 -8 C -24 -34 24 -36 29 -8" fill="none" stroke="{OUT}" stroke-width="6" stroke-linecap="round"/>'
            f'<path d="M {29 * sgn} -8 q {9 * sgn} -5 {12 * sgn} -14" fill="none" stroke="{OUT}" stroke-width="5" stroke-linecap="round"/>'
            '<path d="M -20 32 C -8 38 8 38 20 32" fill="none" stroke="#c99a8a" stroke-width="1.8" opacity=".6"/></g>'
            f'<g class="e-happy"><path d="M -27 12 Q 0 -32 27 12" fill="none" stroke="{OUT}" stroke-width="7.5" stroke-linecap="round"/><path d="M {27 * sgn} 12 q {8 * sgn} -2 {11 * sgn} -10" fill="none" stroke="{OUT}" stroke-width="5" stroke-linecap="round"/></g>'
            f'<g class="e-closed"><path d="M -27 -6 Q 0 16 27 -6" fill="none" stroke="{OUT}" stroke-width="6.5" stroke-linecap="round"/><path d="M {27 * sgn} -6 q {8 * sgn} -2 {12 * sgn} -12" fill="none" stroke="{OUT}" stroke-width="5" stroke-linecap="round"/></g>'
            '</g></g>')

BROW_D = {
    'neutral': ('M 214 318 C 228 308 248 308 262 314', 'M 338 314 C 352 308 372 308 386 318'),
    'up':      ('M 214 304 C 228 290 248 290 262 298', 'M 338 298 C 352 290 372 290 386 304'),
    'soft':    ('M 214 318 C 230 308 250 304 262 306', 'M 338 306 C 350 304 370 308 386 318'),
    'worried': ('M 212 322 C 232 316 250 306 264 294', 'M 336 294 C 350 306 368 316 388 322'),
    'sad':     ('M 212 326 C 232 320 250 310 264 300', 'M 336 300 C 350 310 368 320 388 326'),
    'furrow':  ('M 214 304 C 230 308 248 316 264 322', 'M 336 322 C 352 316 370 308 386 304'),
    'raise':   ('M 214 318 C 228 308 248 308 262 314', 'M 338 296 C 352 282 372 282 386 298'),
    'flat':    ('M 216 314 L 262 314', 'M 338 314 L 384 314'),
    'relaxed': ('M 214 320 C 228 313 248 313 262 317', 'M 338 317 C 352 313 372 313 386 320'),
}
def brows():
    return ''.join(f'<g class="b b-{k}" fill="none" stroke="#2b1e44" stroke-width="4.4" stroke-linecap="round"><path d="{a}"/><path d="{b}"/></g>' for k, (a, b) in BROW_D.items())

def mouths():
    st = 'fill="none" stroke="#b0485f" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"'
    m = {
      'smile': f'<path d="M 282 410 Q 300 442 318 410 Q 300 418 282 410 Z" fill="#d6527a" stroke="{OUT}" stroke-width="2.8" stroke-linejoin="round"/><path d="M 290 422 Q 300 434 310 422 Q 300 426 290 422 Z" fill="#ff9db8"/><path d="M 286 412 Q 300 418 314 412" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".9"/>',
      'smile-closed': f'<path d="M 283 414 Q 300 432 317 414" {st}/><path d="M 281 412 l -3 -4 M 319 412 l 3 -4" fill="none" stroke="#b0485f" stroke-width="3" stroke-linecap="round"/>',
      'grin': f'<path d="M 268 406 Q 300 466 332 406 Q 300 420 268 406 Z" fill="#d6527a" stroke="{OUT}" stroke-width="3" stroke-linejoin="round"/><path d="M 282 432 Q 300 454 318 432 Q 300 440 282 432 Z" fill="#ff9db8"/><path d="M 274 409 Q 300 421 326 409" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>',
      'o': f'<ellipse cx="300" cy="426" rx="9" ry="12" fill="#b8405f" stroke="{OUT}" stroke-width="2.8"/><ellipse cx="300" cy="432" rx="5" ry="4" fill="#ff9db8"/>',
      'frown': f'<path d="M 286 431 Q 300 416 314 431" {st}/>',
      'flat': f'<path d="M 288 424 L 312 424" {st}/>',
      'wavy': f'<path d="M 282 424 Q 291 416 300 424 Q 309 432 318 424" {st}/>',
      'smirk': f'<path d="M 284 421 Q 304 434 322 410" {st}/><path d="M 324 408 l 3 -5" fill="none" stroke="#b0485f" stroke-width="3" stroke-linecap="round"/>',
      'tongue': f'<path d="M 283 413 Q 300 434 317 413" {st}/><path d="M 296 424 Q 306 446 316 428 Q 306 432 296 424 Z" fill="#ff8fae" stroke="{OUT}" stroke-width="2.6" stroke-linejoin="round"/><path d="M 306 428 L 307 438" stroke="#d6527a" stroke-width="2" stroke-linecap="round"/>',
      'cat': f'<path d="M 284 416 Q 292 428 300 417 Q 308 428 316 416" fill="none" stroke="#b0485f" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>',
    }
    out = ''.join(f'<g class="m m-{k}">{v}</g>' for k, v in m.items())
    out += f'<g class="m-talk"><ellipse cx="300" cy="426" rx="15" ry="11" fill="#c6446a" stroke="{OUT}" stroke-width="3"/><ellipse cx="300" cy="432" rx="8" ry="5" fill="#ff9db8"/><path d="M 288 420 Q 300 424 312 420" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></g>'
    return out

def face_fx():
    drop = lambda x, y: f'<g transform="translate({x} {y})"><path class="drop" d="M 0 0 C -6 9 -7 16 0 19 C 7 16 6 9 0 0 Z" fill="#c9e9ff" stroke="#7ab8ff" stroke-width="2"/></g>'
    return ('<g class="fx fx-tear">' + drop(232, 398) + drop(368, 398) + '</g>'
            '<g class="fx fx-sweat"><g transform="translate(406 312)"><path class="drop" d="M 0 0 C -7 10 -8 18 0 22 C 8 18 7 10 0 0 Z" fill="#d8efff" stroke="#7ab8ff" stroke-width="2"/><ellipse cx="-2" cy="14" rx="2" ry="3" fill="#fff" opacity=".9"/></g></g>'
            '<g class="fx fx-shy" stroke="#ff6f95" stroke-width="3" stroke-linecap="round" opacity=".85"><path d="M 204 384 l 7 11 M 216 382 l 7 11 M 228 383 l 7 11 M 366 383 l 7 11 M 378 382 l 7 11 M 390 384 l 7 11"/></g>')

def world_fx():
    s = []
    s.append('<radialGradient id="glowg"><stop offset="0" stop-color="#ffd1e6" stop-opacity=".75"/><stop offset=".6" stop-color="#ffe9a8" stop-opacity=".25"/><stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/></radialGradient>')
    s.append('<circle class="fx fx-glow" cx="300" cy="520" r="130" fill="url(#glowg)"/>')
    s.append('<g class="fx fx-sparkle">' + ''.join(re.sub(r' style="[^"]*"', '', sparkle(x, y, r, '#fff2b8')) for x, y, r in [(140, 236, 13), (462, 226, 15), (108, 330, 9), (494, 340, 11), (190, 150, 10), (410, 146, 12), (300, 112, 9), (150, 440, 8)]) + '</g>')
    heart = lambda x, y, c: f'<path class="ht" transform="translate({x} {y})" d="M 0 8 C -14 -2 -10 -14 0 -8 C 10 -14 14 -2 0 8 Z" fill="{c}" stroke="#2a1a4d" stroke-width="2" stroke-linejoin="round"/>'
    s.append('<g class="fx fx-hearts">' + heart(240, 540, '#ff9db8') + heart(360, 548, '#ffb3c8') + heart(300, 520, '#ff8aa8') + heart(270, 560, '#ffc2d4') + heart(335, 535, '#ff9db8') + '</g>')
    s.append('<g class="fx fx-think" fill="#fff" stroke="#2a1a4d" stroke-width="2"><circle cx="436" cy="262" r="6"/><circle cx="458" cy="232" r="9"/><circle cx="490" cy="192" r="14"/></g>')
    s.append('<g class="fx fx-shock" stroke="#ffd36b" stroke-width="5" stroke-linecap="round" fill="none"><path d="M 436 286 l 26 -12 M 442 318 l 30 0 M 436 350 l 26 12"/><path d="M 164 286 l -26 -12 M 158 318 l -30 0 M 164 350 l -26 12"/></g>')
    return '\n'.join(s)

def ear_geom(sgn):
    """Hình học tai (vẽ theo tai phải rồi lật). fill: vùng da của tai (chân tai thụt vào trong má); outer: đường viền ngoài; rim: gờ vành tai."""
    EAR_OUT = 0.62   # độ nhô ra khỏi má (1 = ban đầu); nhỏ hơn thì tai sát mặt hơn
    X = lambda x: 300 + sgn * ((410 + (x - 410) * EAR_OUT if x > 410 else x) - 300)
    ang = sgn * 10; cx, cy = X(414), 358
    outer = f'M {X(418)} 334 C {X(433)} 327 {X(440)} 344 {X(435)} 361 C {X(431)} 374 {X(421)} 385 {X(410)} 381'
    fill = outer + f' L {X(402)} 380 L {X(410)} 330 Z'
    rim = f'M {X(422)} 340 C {X(431)} 339 {X(434)} 349 {X(431)} 358 C {X(429)} 365 {X(424)} 368 {X(421)} 366'
    t = math.radians(ang); px, py = X(411), 381; dx, dy = px - cx, py - cy
    lobe = (cx + dx * math.cos(t) - dy * math.sin(t), cy + dx * math.sin(t) + dy * math.cos(t))
    return dict(fill=fill, outer=outer, rim=rim, ang=ang, cx=cx, cy=cy, lobe=lobe)

POSES_BACK, POSES_FRONT = poses()
def build():
    S = []
    S.append(f'<svg xmlns="http://www.w3.org/2000/svg" class="hm" viewBox="0 0 600 800" data-eyes="open" data-brows="neutral" data-mouth="smile-closed" data-pose="hold" data-blush="n" data-fx="">')
    S.append('<title>Huyền My</title>')
    S.append(f'<style>{css()}</style>')
    S.append('<defs>' + veil_defs()
             + '<linearGradient id="hairg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2b2b31"/><stop offset=".5" stop-color="#101014"/><stop offset="1" stop-color="#000"/></linearGradient>'
             + '<linearGradient id="hairg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#26262c"/><stop offset=".5" stop-color="#0d0d10"/><stop offset="1" stop-color="#000"/></linearGradient>'
             + '<linearGradient id="adg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9a69ea"/><stop offset=".55" stop-color="#7344c8"/><stop offset="1" stop-color="#4e2a97"/></linearGradient>'
             + '<linearGradient id="adg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a98af0"/><stop offset="1" stop-color="#6a3dc0"/></linearGradient>'
             + '<radialGradient id="skin" gradientUnits="userSpaceOnUse" cx="300" cy="313" r="156"><stop offset="0" stop-color="#fff0e4"/><stop offset=".7" stop-color="#ffdcc6"/><stop offset="1" stop-color="#f3bfa6"/></radialGradient>'
             + '<radialGradient id="blush"><stop offset="0" stop-color="#ff7fa0" stop-opacity=".7"/><stop offset="1" stop-color="#ff7fa0" stop-opacity="0"/></radialGradient>'
             + '<radialGradient id="iris" cx=".5" cy=".38" r=".7"><stop offset="0" stop-color="#9d7bf0"/><stop offset=".45" stop-color="#4b2f93"/><stop offset="1" stop-color="#1b0f3c"/></radialGradient>'
             + '<radialGradient id="orbg" cx=".38" cy=".34" r=".75"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#ffe9a8"/><stop offset=".75" stop-color="#b48cf5"/><stop offset="1" stop-color="#6b3fc4"/></radialGradient>'
             + '<radialGradient id="halo"><stop id="halo-in" offset="0" stop-color="#ffe9a8" stop-opacity=".85"/><stop id="halo-out" offset="1" stop-color="#ffe9a8" stop-opacity="0"/></radialGradient>'
             + '</defs>')
    S.append('<ellipse id="shadow" cx="300" cy="768" rx="150" ry="16" fill="#1c1040" opacity=".28"/>')
    S.append('<g id="all">')
    S.append(veil_back(True))
    S.append('<g id="body">')
    S.append(f'<path d="M 186 292 C 150 380 154 520 186 596 C 208 640 244 624 254 580 L 346 580 C 356 624 392 640 414 596 C 446 520 450 380 414 292 Z" fill="url(#hairg)" stroke="{OUT}" stroke-width="3.5" stroke-linejoin="round"/>')
    S.append('<path d="M 172 410 C 166 470 172 540 190 586" fill="none" stroke="#5a5a68" stroke-width="3.5" stroke-linecap="round" opacity=".45"/><path d="M 428 410 C 434 470 428 540 410 586" fill="none" stroke="#5a5a68" stroke-width="3.5" stroke-linecap="round" opacity=".45"/>')
    S.append(f'<g id="arms-back">{POSES_BACK}</g>')
    S.append(f'<path d="M 246 632 L 296 632 L 292 742 L 226 742 Z" fill="#fff6e6" stroke="{OUT}" stroke-width="3.2" stroke-linejoin="round"/><path d="M 304 632 L 354 632 L 374 742 L 308 742 Z" fill="#fff6e6" stroke="{OUT}" stroke-width="3.2" stroke-linejoin="round"/>')
    for x in (258, 342):
        S.append(f'<path d="M {x-36} 746 C {x-36} 726 {x+30} 726 {x+36} 746 C {x+38} 760 {x-38} 760 {x-36} 746 Z" fill="#a357d9" stroke="{OUT}" stroke-width="3.2" stroke-linejoin="round"/><path d="M {x-24} 742 C {x-10} 734 {x+14} 734 {x+26} 742" fill="none" stroke="#f6d77a" stroke-width="3" stroke-linecap="round"/>')
    S.append(f'<path d="M 300 548 L 258 552 C 246 604 208 664 180 708 C 220 724 262 728 296 718 Z" fill="url(#adg)" stroke="{OUT}" stroke-width="3.5" stroke-linejoin="round"/><path d="M 300 548 L 342 552 C 354 604 392 664 420 708 C 380 724 338 728 304 718 Z" fill="url(#adg)" stroke="{OUT}" stroke-width="3.5" stroke-linejoin="round"/>')
    S.append(f'<path d="M 246 484 C 244 470 268 460 300 458 C 332 460 356 470 354 484 C 360 514 352 540 346 564 L 254 564 C 248 540 240 514 246 484 Z" fill="url(#adg)" stroke="{OUT}" stroke-width="3.5" stroke-linejoin="round"/>')
    S.append(f'<path d="M 300 470 L 346 500 C 352 540 356 590 366 650 C 372 690 372 712 392 726 C 352 742 318 738 292 724 C 300 650 304 560 300 470 Z" fill="url(#adg2)" stroke="{OUT}" stroke-width="3.5" stroke-linejoin="round"/>')
    S.append('<path d="M 300 470 L 346 500 L 344 512" fill="none" stroke="#f6d77a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>')
    for (x, y) in [(318, 480), (334, 492), (344, 520), (346, 552), (350, 586)]:
        S.append(f'<circle cx="{x}" cy="{y}" r="3.2" fill="#f6d77a" stroke="{OUT}" stroke-width="1.6"/>')
    S.append('<path d="M 184 706 C 224 722 262 726 294 716" fill="none" stroke="#f6d77a" stroke-width="3.5" stroke-linecap="round"/><path d="M 308 722 C 346 736 380 730 396 722" fill="none" stroke="#f6d77a" stroke-width="3.5" stroke-linecap="round"/>')
    for (x, y, sc) in [(232, 646, .62), (214, 690, .5), (264, 684, .56), (346, 642, .62), (336, 696, .56), (374, 684, .5), (286, 606, .42), (320, 600, .42)]:
        S.append(sen(x, y, sc))
    for sgn in (-1, 1):
        x = 300 + sgn * 112
        S.append(f'<path d="M {x} 340 C {x+sgn*10} 400 {x+sgn*8} 462 {x-sgn*10} 520 C {x-sgn*20} 486 {x-sgn*22} 420 {x-sgn*16} 356 Z" fill="url(#hairg)" stroke="{OUT}" stroke-width="3.2" stroke-linejoin="round"/>')
    S.append(f'<path d="M 280 428 L 280 470 C 290 478 310 478 320 470 L 320 428 Z" fill="#ffd9c2" stroke="{OUT}" stroke-width="3"/><path d="M 280 440 C 292 450 308 450 320 440 L 320 428 L 280 428 Z" fill="#e8b79c" opacity=".6"/>')
    S.append(f'<path d="M 270 456 C 286 466 314 466 330 456 L 330 478 C 312 486 288 486 270 478 Z" fill="#8a57de" stroke="{OUT}" stroke-width="3" stroke-linejoin="round"/><path d="M 272 458 C 288 468 312 468 328 458" fill="none" stroke="#f6d77a" stroke-width="3" stroke-linecap="round"/>')
    S.append('</g>')  # body
    # ----- đầu -----
    S.append('<g id="head">')
    FACE_D = "M 180 318 C 180 244 238 212 300 212 C 362 212 420 244 420 318 C 420 392 366 452 300 452 C 234 452 180 392 180 318 Z"
    E = [ear_geom(-1), ear_geom(1)]
    wrap = lambda g, inner: f'<g transform="rotate({g["ang"]} {g["cx"]} {g["cy"]})">{inner}</g>'
    S.append(f'<path d="M 266 430 L 334 430 L 338 478 C 318 490 282 490 262 478 Z" fill="#f3bfa6" stroke="{OUT}" stroke-width="3.2" stroke-linejoin="round"/>')   # cổ, nối cằm với cổ áo
    S.append('<g id="skin-mass">'      # mặt và hai tai là MỘT khối da: viền vẽ một lần cho cả khối, màu da cùng một dải chuyển sắc
             + f'<path d="{FACE_D}" fill="none" stroke="{OUT}" stroke-width="7" stroke-linejoin="round"/>'
             + ''.join(wrap(g, f'<path d="{g["fill"]}" fill="none" stroke="{OUT}" stroke-width="6.4" stroke-linejoin="round"/>') for g in E)
             + f'<path d="{FACE_D}" fill="url(#skin)"/>'
             + ''.join(wrap(g, f'<path d="{g["fill"]}" fill="url(#skin)"/>') for g in E) + '</g>')
    S.append('<g id="features">')
    S.append('<g class="blush"><ellipse cx="226" cy="396" rx="30" ry="17" fill="url(#blush)"/></g><g class="blush"><ellipse cx="374" cy="396" rx="30" ry="17" fill="url(#blush)"/></g>')
    S.append('<g stroke="#ff6f95" stroke-width="2.2" stroke-linecap="round" opacity=".6"><path d="M 212 392 l 5 8 M 222 391 l 5 8 M 232 392 l 5 8"/><path d="M 362 392 l 5 8 M 372 391 l 5 8 M 382 392 l 5 8"/></g>')
    S.append(eye(-1) + eye(1))
    S.append('<path d="M 297 396 Q 300 400 303 396" fill="none" stroke="#d99a86" stroke-width="2.6" stroke-linecap="round"/>')
    S.append(f'<g id="mouths">{mouths()}</g>')
    S.append(face_fx())
    S.append('</g>')  # features
    S.append('<g id="hair-front">')
    S.append(f'<path d="M 176 332 C 170 262 226 220 300 220 C 374 220 430 262 424 332 C 420 314 410 304 398 301 Q 384 307 368 300 Q 352 294 334 301 Q 318 307 300 300 Q 282 307 266 301 Q 248 294 232 300 Q 216 307 202 301 C 190 304 180 314 176 332 Z" fill="url(#hairg2)" stroke="{OUT}" stroke-width="3.2" stroke-linejoin="round"/>')
    S.append('<g fill="none" stroke="#5a5a68" stroke-linecap="round"><path d="M 214 262 C 248 246 290 242 332 246" stroke-width="3.4" opacity=".7"/><path d="M 360 252 C 388 260 406 276 412 296" stroke-width="3" opacity=".55"/></g>')
    for sgn in (-1, 1):
        x = 300 + sgn * 124
        S.append(f'<path d="M {x} 300 C {x+sgn*14} 350 {x+sgn*8} 420 {x-sgn*14} 462 C {x-sgn*10} 410 {x-sgn*14} 350 {x-sgn*10} 306 Z" fill="url(#hairg)" stroke="{OUT}" stroke-width="3" stroke-linejoin="round"/>')
    S.append('</g>')
    S.append(f'<g id="brows" opacity=".95">{brows()}</g>')
    S.append('<g transform="translate(0,-30)">' + hat() + '</g>')
    for sgn in (-1, 1):
        bx, by = bez(L, C, R, 0.5 + sgn * 0.36); by -= 30
        d = f'M {bx:.0f} {by:.0f} C {bx+sgn*(-6):.0f} {by+90:.0f} {300+sgn*86} 440 {300+sgn*14} 458'
        S.append(f'<path d="{d}" fill="none" stroke="{OUT}" stroke-width="9" stroke-linecap="round"/><path d="{d}" fill="none" stroke="#a97bf0" stroke-width="5" stroke-linecap="round"/>')
    S.append(f'<path d="M 300 462 C 270 440 258 478 280 484 C 292 486 298 474 300 462 C 302 474 308 486 320 484 C 342 478 330 440 300 462 Z" fill="#a97bf0" stroke="{OUT}" stroke-width="3" stroke-linejoin="round"/>')
    S.append(f'<path d="M 296 474 C 286 500 276 520 268 538 L 282 534 L 292 500 Z M 304 474 C 314 500 324 520 332 538 L 318 534 L 308 500 Z" fill="#8a57de" stroke="{OUT}" stroke-width="2.6" stroke-linejoin="round"/><circle cx="300" cy="466" r="7" fill="#8a57de" stroke="{OUT}" stroke-width="2.6"/>')
    for sgn in (-1, 1):   # miếng da nối chân tai lên má, lấp khe tối giữa lọn tóc và tai
        X = lambda x: 300 + sgn * (x - 300)
        S.append(f'<path d="M {X(398)} 300 L {X(413)} 301 C {X(414)} 316 {X(418)} 328 {X(421)} 336 L {X(402)} 384 L {X(396)} 330 Z" fill="url(#skin)"/>'
                 f'<path d="M {X(413)} 301 C {X(414)} 316 {X(418)} 328 {X(421)} 336" fill="none" stroke="{OUT}" stroke-width="3" stroke-linecap="round"/>')
    for g in E:   # vẽ lại tai ở lớp trên (che dây quai) bằng đúng gradient da và đúng hình khối, nên vẫn liền với má
        lx, ly = g['lobe']
        S.append('<g class="ear">' + wrap(g, f'<path d="{g["fill"]}" fill="url(#skin)"/>'
                 f'<path d="{g["outer"]}" fill="none" stroke="{OUT}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>'
                 f'<path d="{g["rim"]}" fill="none" stroke="#e8b59c" stroke-width="2.2" stroke-linecap="round"/>')
                 + f'<circle cx="{lx:.1f}" cy="{ly + 2:.1f}" r="3" fill="#f6d77a" stroke="{OUT}" stroke-width="1.8"/>'
                 f'<path d="M {lx:.1f} {ly + 5:.1f} L {lx:.1f} {ly + 12:.1f}" stroke="#d9b36a" stroke-width="2.4" stroke-linecap="round"/>'
                 f'<ellipse cx="{lx:.1f}" cy="{ly + 23:.1f}" rx="6" ry="9.5" fill="#6ee0b4" stroke="{OUT}" stroke-width="2.4"/><ellipse cx="{lx - 2:.1f}" cy="{ly + 19:.1f}" rx="1.8" ry="3" fill="#fff" opacity=".9"/></g>')
    S.append('</g>')  # head
    # ----- quả cầu + tay -----
    S.append('<g id="orb"><circle cx="300" cy="556" r="64" fill="url(#halo)"/><circle cx="300" cy="552" r="27" fill="url(#orbg)" stroke="#2a1a4d" stroke-width="3"/>'
             '<path d="M 288 548 a 13 13 0 1 0 14 -14 a 10 10 0 1 1 -14 14 Z" fill="#7a4fd0" opacity=".55"/><circle cx="290" cy="542" r="6" fill="#fff" opacity=".9"/>'
             '<circle cx="300" cy="552" r="38" fill="none" stroke="#f6d77a" stroke-width="2" stroke-dasharray="3 5" opacity=".9"/></g>')
    S.append(f'<g id="arms">{POSES_FRONT}</g>')
    S.append(veil_front(True))
    S.append(world_fx())
    S.append('</g>')  # all
    for (x, y, r, f) in [(92, 170, 16, '#fff6c9'), (520, 150, 12, '#e6dcff'), (80, 430, 10, '#fff6c9'), (528, 440, 16, '#fff6c9'), (60, 600, 9, '#e6dcff'), (548, 610, 10, '#fff6c9')]:
        S.append(sparkle(x, y, r, f).replace('class="sp"', 'class="sp0"'))
    S.append(lotus(118, 744, 0.62)); S.append(lotus(486, 748, 0.55))
    S.append('</svg>')
    return '\n'.join(S)

open(sys.argv[1], 'w', encoding='utf-8').write(build())
print('rig ok', sys.argv[1])
