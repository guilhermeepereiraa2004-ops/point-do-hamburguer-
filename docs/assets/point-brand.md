# Marca PH aplicada ao site

> Versão inicial substituída. A correção vigente usa imagens com transparência real e URLs v2; veja [Logo PH — transparência corrigida](point-brand-transparency.md).

Atualizado em 24/11/2026.

A logo completa usa a versão `logo-ph-refinada-v3` escolhida na conversa. O ícone foi extraído da apresentação `identidade-ph-apresentacao-v1` usando a ferramenta integrada imagegen, preservando PH, coroa e hambúrguer. As fontes originais permanecem em `output/branding/` no workspace. As imagens consumidas pelo site ficam em `point-delivery/public/`, sem dependência dos arquivos locais de geração.

## Arquivos da versão inicial, substituídos pela v2

- `public/images/brand/point-logo-v1.webp`: logo completa, 800 × 450, 61.298 bytes.
- `public/images/brand/point-icon-v1.webp`: ícone PH, 512 × 512, 39.742 bytes.
- `public/icons/ph-192-v1.png`, `ph-512-v1.png`, `ph-maskable-512-v1.png`, `ph-apple-touch-v1.png` e `ph-favicon-v1.png`: tamanhos de instalação e navegador.
- `public/icons/point-192.png`: alias de compatibilidade para a imagem usada nas notificações existentes. Nenhuma opção, lógica de som ou envio de notificações foi alterada.

O script `node scripts/generate-app-icons.mjs` reproduz os PNGs a partir do ícone WebP incluído no repositório. `BrandLogo` centraliza dimensões, texto alternativo, carregamento e variantes. A logo completa aparece no cabeçalho/rodapé, login e acompanhamento; o ícone aparece no painel, no desenho do app instalado e nos metadados de instalação. Hero e funcionamento do pedido são preservados.

## Prompt da extração do ícone

Use case: precise-object-edit / compositing. The attached presentation board is the EDIT TARGET. Extract ONLY the square black social avatar in the LOWER RIGHT of this board as a standalone usable website/app icon. Preserve that exact avatar's identity and visual style: forward-slanted orange P, ivory/silver H, small gold crown on the P, realistic hamburger in front, restrained thin orange circular frame, black background. NO restaurant name or slogan. DO NOT include the logo from the left, packaging, cup, palette or presentation background. This is a faithful extraction, not a redesign: preserve the avatar's natural photoreal food and restrained orange/gold metallic highlights. Make ONE centered SQUARE icon, straight-on, with no perspective, no cast shadow, no 3D tile mockup. Flat opaque pure-black square canvas extends fully to every edge. Main emblem occupies roughly 75% of the square, entirely within a central safe area for app-icon cropping, with generous black padding on all sides. No rounded outer corners; operating systems will provide their own mask. Sharp, complete, well-balanced, no cropped crown or letters. No new text, no extra decoration, no watermark.

