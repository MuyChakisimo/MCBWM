// Minimal PNG reading and writing for texture atlases (java-port.mjs: a gun's built-in scope texture under
// the gun's). Reads 8-bit RGB / RGBA, non-interlaced (every Java TACZ texture); writes RGBA.
//   const { width, height, data } = decode(buffer);   data: RGBA bytes, row by row
//   encode({ width, height, data }) -> Buffer
const zlib = require("zlib");

const SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function decode(buf) {
  if (!buf.subarray(0, 8).equals(SIGNATURE)) throw new Error("not a PNG");
  let at = 8, width, height, depth, color, interlace;
  const idat = [];
  while (at < buf.length) {
    const len = buf.readUInt32BE(at), type = buf.toString("ascii", at + 4, at + 8), body = buf.subarray(at + 8, at + 8 + len);
    if (type === "IHDR") ({ 0: depth, 1: color, 4: interlace } = body.subarray(8)), (width = body.readUInt32BE(0)), (height = body.readUInt32BE(4));
    else if (type === "IDAT") idat.push(body);
    else if (type === "IEND") break;
    at += 12 + len;
  }
  if (depth !== 8 || ![2, 6].includes(color) || interlace) throw new Error(`PNG not supported (bit depth ${depth}, color type ${color}, interlace ${interlace}): only 8-bit RGB / RGBA, not interlaced`);
  const bpp = color === 6 ? 4 : 3, stride = width * bpp;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const px = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)], line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? px[y * stride + x - bpp] : 0, b = y ? px[(y - 1) * stride + x] : 0, c = x >= bpp && y ? px[(y - 1) * stride + x - bpp] : 0;
      const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      const pred = [0, a, b, (a + b) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? b : c][filter];
      if (pred === undefined) throw new Error(`PNG filter ${filter} unknown`);
      px[y * stride + x] = (line[x] + pred) & 255;
    }
  }
  if (bpp === 4) return { width, height, data: px };
  const data = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) px.copy(data, i * 4, i * 3, i * 3 + 3), (data[i * 4 + 3] = 255);
  return { width, height, data };
}

const CRC = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (b) => { let c = 0xffffffff; for (const x of b) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type, body) {
  const out = Buffer.alloc(12 + body.length);
  out.writeUInt32BE(body.length, 0);
  out.write(type, 4, "ascii");
  body.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + body.length)), 8 + body.length);
  return out;
}

function encode({ width, height, data }) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) data.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  return Buffer.concat([SIGNATURE, chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

/** `bottom` under `top` (transparent where narrower). */
function stack(top, bottom) {
  const width = Math.max(top.width, bottom.width), height = top.height + bottom.height;
  const data = Buffer.alloc(width * height * 4);
  for (const [img, y0] of [[top, 0], [bottom, top.height]])
    for (let y = 0; y < img.height; y++) img.data.copy(data, ((y0 + y) * width) * 4, y * img.width * 4, (y + 1) * img.width * 4);
  return { width, height, data };
}

module.exports = { decode, encode, stack };
