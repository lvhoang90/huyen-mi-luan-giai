// Nhóm thiết bị thô từ User-Agent: chỉ giữ loại máy, hệ điều hành và trình duyệt, không lưu chuỗi gốc.
export function deviceOf(ua = '') {
  const s = String(ua);
  const os = /iPhone|iPad|iPod/.test(s) ? 'iOS' : /Android/.test(s) ? 'Android' : /Windows/.test(s) ? 'Windows' : /Mac OS X|Macintosh/.test(s) ? 'macOS' : /Linux|X11/.test(s) ? 'Linux' : 'Khác';
  const device = /iPad|Tablet/.test(s) ? 'tablet' : /Mobi|iPhone|Android.*Mobile/.test(s) ? 'mobile' : os === 'Android' ? 'tablet' : 'desktop';
  const browser = /Zalo/i.test(s) ? 'Zalo' : /FBAN|FBAV|FB_IAB/.test(s) ? 'Facebook' : /Instagram/.test(s) ? 'Instagram' : /EdgA?\//.test(s) ? 'Edge' : /OPR\/|Opera/.test(s) ? 'Opera' : /CriOS|Chrome\//.test(s) ? 'Chrome' : /FxiOS|Firefox\//.test(s) ? 'Firefox' : /Safari\//.test(s) ? 'Safari' : 'Khác';
  return { device, os, browser };
}
