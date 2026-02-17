#include <stdlib.h>
#include <stdio.h>
#include <stdint.h>
#include <zbar.h>
#include "emscripten.h"

// External javascript function to pass the retrieved data to.
extern void js_output_result(const char *symbolName, const char *data, const int *polygon, const unsigned polysize);

zbar_image_scanner_t *scanner = NULL;

/** Pre-allocated scan buffer — reused across calls to avoid malloc/free per tick. */
static uint8_t *scan_buffer = NULL;
static int scan_buffer_size = 0;

/** No-op cleanup handler: buffer is managed by create_buffer/destroy_buffer, not ZBar. */
static void noop_cleanup(zbar_image_t *img)
{
    (void)img;
}

/** Lazily create and configure the scanner once. */
static void ensure_scanner(void)
{
    if (scanner) return;

    scanner = zbar_image_scanner_create();
    zbar_image_scanner_set_config(scanner, 0, ZBAR_CFG_X_DENSITY, 1);
    zbar_image_scanner_set_config(scanner, 0, ZBAR_CFG_Y_DENSITY, 1);
}

/** Internal: scan a Y800 grayscale buffer. Buffer is NOT freed by ZBar. */
static int scan_y800(uint8_t *raw, int width, int height)
{
    ensure_scanner();

    zbar_image_t *image = zbar_image_create();
    zbar_image_set_format(image, zbar_fourcc('Y', '8', '0', '0'));
    zbar_image_set_size(image, width, height);
    zbar_image_set_data(image, raw, width * height, noop_cleanup);

    int n = zbar_scan_image(scanner, image);

    const zbar_symbol_t *symbol = zbar_image_first_symbol(image);
    for (; symbol; symbol = zbar_symbol_next(symbol))
    {
        zbar_symbol_type_t typ = zbar_symbol_get_type(symbol);
        const char *data = zbar_symbol_get_data(symbol);

        unsigned poly_size = zbar_symbol_get_loc_size(symbol);
        int poly[poly_size * 2];
        unsigned u = 0;
        for (unsigned p = 0; p < poly_size; p++)
        {
            poly[u] = zbar_symbol_get_loc_x(symbol, p);
            poly[u + 1] = zbar_symbol_get_loc_y(symbol, p);
            u += 2;
        }

        js_output_result(zbar_get_symbol_name(typ), data, poly, poly_size);
    }

    zbar_image_destroy(image);
    return n;
}

/** Scan a pre-converted Y800 grayscale buffer. */
EMSCRIPTEN_KEEPALIVE
int scan_image(uint8_t *raw, int width, int height)
{
    return scan_y800(raw, width, height);
}

/**
 * Scan an RGBA buffer. Converts RGBA to Y800 (BT.601 luma) in-place,
 * then passes to ZBar. The buffer must be at least width*height*4 bytes.
 * The buffer is NOT freed — caller manages its lifetime via create/destroy_buffer.
 */
EMSCRIPTEN_KEEPALIVE
int scan_image_rgba(uint8_t *rgba, int width, int height)
{
    int pixels = width * height;
    for (int i = 0, j = 0; j < pixels; i += 4, j++)
    {
        rgba[j] = (uint8_t)((rgba[i] * 66 + rgba[i + 1] * 129 + rgba[i + 2] * 25 + 4096) >> 8);
    }
    return scan_y800(rgba, width, height);
}

/** Tear down the reusable scanner. Call once when done scanning. */
EMSCRIPTEN_KEEPALIVE
void destroy_scanner(void)
{
    if (scanner)
    {
        zbar_image_scanner_destroy(scanner);
        scanner = NULL;
    }
}

/**
 * Return a reusable buffer on the WASM heap for RGBA image data.
 * Grows if needed but never shrinks — avoids malloc/free per scan tick.
 */
EMSCRIPTEN_KEEPALIVE
uint8_t *create_buffer(int width, int height)
{
    int needed = width * height * 4;
    if (scan_buffer && scan_buffer_size >= needed)
        return scan_buffer;

    free(scan_buffer);
    scan_buffer = malloc(needed);
    scan_buffer_size = scan_buffer ? needed : 0;
    return scan_buffer;
}

/** Free the reusable scan buffer. Call once when done scanning. */
EMSCRIPTEN_KEEPALIVE
void destroy_buffer(uint8_t *p)
{
    (void)p;
    free(scan_buffer);
    scan_buffer = NULL;
    scan_buffer_size = 0;
}
