import QRCode from "qrcode";

export function qrGeometry(payload) {
  const { modules } = QRCode.create(payload, { errorCorrectionLevel: "M" });
  const margin = 4;
  let path = "";
  for (let row = 0; row < modules.size; row++) {
    for (let col = 0; col < modules.size; col++) {
      if (modules.data[row * modules.size + col])
        path += `M${col + margin} ${row + margin}h1v1h-1z`;
    }
  }
  return { size: modules.size + margin * 2, path };
}

export function equipmentQrSvg(payload) {
  const { size, path } = qrGeometry(payload);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="480" height="480" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="#FFFFFF"/><path d="${path}" fill="#1e1e1e"/></svg>`;
}

export function downloadEquipmentQr(item, payload) {
  const url = URL.createObjectURL(
    new Blob([equipmentQrSvg(payload)], {
      type: "image/svg+xml;charset=utf-8",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `${item.inventoryCode}-qr.svg`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
