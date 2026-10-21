# Imagens fotográficas do montador

Data: 20/10/2026. Criadas para este projeto com a ferramenta integrada ImageGen, uma geração por ingrediente, com transparência real. São imagens fotorrealistas geradas por IA, não fotos dos produtos reais da hamburgueria.

## Arquivos finais

Pasta: `point-delivery/public/ingredients/`.

- `pao-topo.png`
- `pao-base.png`
- `carne-hamburguer.png`
- `frango.png`
- `queijo.png`
- `cheddar.png`
- `catupiry.png`
- `presunto.png`
- `bacon.png`
- `ovo.png`
- `calabresa.png`
- `salsicha.png`
- `milho-verde.png`
- `ervilha.png`
- `cebola.png`
- `salada.png`
- `batata-palha.png`

Os 17 PNGs originais foram preservados sem edição. `components/ingredient-photos.json` registra as dimensões e os limites dos pixels visíveis, calculados por leitura do canal alpha. O navegador enquadra cada fotografia por SVG, sem alterar o PNG. Cada repetição de ingrediente utiliza uma instância da mesma fotografia. Pão tem dois recortes (topo e base); os outros 15 correspondem ao cardápio.

## Prompts finais

Cada prompt é a concatenação exata da base comum abaixo com o assunto correspondente.

Base comum:

> Use case: product-mockup. Create ONE isolated photorealistic food photography cutout for a live burger configurator. This must look like a real ingredient photographed in a professional studio, NOT a cartoon, illustration, vector, plastic 3D render, or icon. Camera: straight front side view with only 10 degrees looking down, wide horizontal silhouette appropriate to a burger layer. All ingredients for this project share this exact camera and warm soft studio lighting from upper left. Transparent background, no plate, no surface, no background, no contact shadow, no floating garnish, no text, no watermark. The ENTIRE ingredient must be visible. Center the ingredient, filling about 85% of image width. Wide landscape image. Primary subject: 

### pao-topo

one upper HALF of a real round sesame hamburger bun, golden brown baked crust, little irregular sesame seeds, soft highlights, horizontally sliced flat underside visible, dome facing up. Only the top bun half; no lower bun or filling.

### pao-base

one LOWER HALF of a real round hamburger bun, horizontally cut with pale bread crumb top visible as a narrow ellipse, golden toasted rim and soft baked bottom. This is a shallow flat burger bun base, NOT a full bun. No upper bun or filling.

### carne-hamburguer

one thick round flame-grilled beef burger patty, 120g, real irregular browned seared edges, juicy dark brown meat texture and subtle grill marks, appetizing. Exactly one patty, no bread, no cheese.

### frango

one low circular burger-sized layer of cooked shredded chicken breast, moist tender pale golden strands, subtle toasted edges. Form a compact irregular round patty-shaped portion suitable for a Brazilian hamburger. Chicken only, no bread or garnish.

### queijo

one thin slice of pale golden mozzarella cheese warmed and gently melting, a broad square slice draping down slightly at the front edge, natural buttery sheen, subtle irregular corners. Very low side-view burger layer, nearly horizontal; no bread or meat.

### cheddar

one slice of real orange cheddar cheese, gently melted and draping in small rounded folds at front, glossy warm orange surface, broad square shape seen from the low front angle. Very thin side-view burger layer. Cheese only, no meat or bread.

### catupiry

a single low wide swirl layer of authentic creamy white Brazilian cream cheese spread, thick smooth glossy off-white dairy with natural soft piping folds, arranged as a round burger-width layer. White cream cheese only, no herbs or other ingredients.

### presunto

one thin slice of real cooked pink ham folded loosely into a broad flat burger layer, natural moist fibrous ham texture with slightly darker edges, low gentle folds. No bread, cheese or garnish.

### bacon

two strips of real crispy cooked bacon laid side by side to form ONE low wide burger topping layer, irregular rippled edges, caramelized reddish brown meat and golden rendered fat, natural crisp texture. Bacon only; no bread, cheese or other ingredients.

### ovo

one freshly fried egg as a low wide burger topping, real gently crisp lacy white edges, softly set opaque white and a bright golden orange rounded yolk near the middle, viewed from low front side angle. Egg only, no plate, bread or garnish.

### calabresa

a low broad burger-width layer of five overlapping thin slices of Brazilian calabresa sausage, browned caramelized edges, warm reddish-brown sausage and visible natural fat flecks. Slices lay almost flat in one single layer, not a tall pile. No other ingredients.

### salsicha

a low burger-width layer of cooked Brazilian hot-dog sausage split lengthwise into three thin elongated strips and laid flat next to one another, natural smooth lightly browned pink-orange sausage surfaces. Not a whole hot dog; no bread, sauce or garnish.

### milho-verde

a small low compact circular portion of real yellow sweetcorn kernels as a burger topping, glossy juicy irregular kernels resting together to form ONE flat wide layer. Only yellow corn kernels; not whole corn on the cob, no container or other food.

### ervilha

a small low compact circular portion of real cooked green peas for a burger topping, tender green peas with subtle natural wrinkles and moist shine, resting closely together as ONE shallow burger-width layer. Only green peas; no pod, plate, container, garnish or other food.

### cebola

a low broad burger-width layer of three overlapping thin rings of real fresh white onion, pearly translucent pale white onion flesh and natural delicate ring texture, rings resting almost horizontally. No purple onion, no bread, no other garnish.

### salada

ONE low burger topping layer consisting of a fresh ruffled green lettuce leaf with two ripe red tomato slices resting on it, arranged horizontally across the burger width, real crisp lettuce veins and juicy tomato flesh, natural irregular edges. Low front side view. Vegetables only, no bread, meat or plate.

### batata-palha

ONE low wide compact burger topping portion of authentic Brazilian batata palha, many tiny thin golden crispy potato matchsticks, irregular slender real fried potato strands, tangled into a flat shallow burger-width layer. These are very thin matchsticks, NOT regular french fries. No other ingredients.

## Integração

Componente: `point-delivery/components/burger-preview.tsx`. Estilos: `point-delivery/app/burger-preview.css`. As miniaturas dos ingredientes e a seleção de pão também usam as fotos. A montagem não utiliza desenhos CSS ou animação dos ingredientes. No celular, a fotografia ocupa a largura do cartão e o resumo fica abaixo. Preços, estoque, pedidos e financeiro não foram alterados.



## Revisão: composição compacta e recheios naturais — 20/10/2026

O usuário rejeitou a montagem em andares. A prévia passou a usar um enquadramento fixo e um espaço compartilhado para os recheios. Carnes mantêm volume e porções visíveis; fatias de queijo se acomodam nas carnes; molhos, vegetais e extras se distribuem dentro do pão. As imagens não são achatadas verticalmente. A composição oculta naturalmente partes dos recheios, enquanto o resumo mantém todas as quantidades exatas.

Foram gerados três novos assets com a ferramenta integrada ImageGen. Originais anteriores preservados; imagens ativas em `point-delivery/public/ingredients/frango-v2.png`, `cebola-v2.png` e `catupiry-v2.png`. O manifesto aponta para esses nomes para evitar cache da versão antiga.

Base dos prompts novos:

> Use case: product-mockup. ONE photorealistic studio food photography cutout for a Brazilian burger assembly UI. Transparent background with genuine alpha. No dish, no tabletop, no shadow, no text, no watermark, no bread or other ingredients. Camera almost level with the food, only 5 degrees above the horizontal, FRONT SIDE VIEW, not overhead. Natural edible food texture, soft warm light upper left, very wide landscape composition. Ingredient forms a very thin low layer, not a heap, dome or full patty. Leave clear transparent margins, entire ingredient visible. Primary subject: 

### frango-v2

A modest portion of actual cooked and finely shredded chicken breast, pale ivory WHITE meat fibers with tiny natural tan toasted tips, short delicate uneven shreds and small flakes, moist and soft. Fine pulled-chicken texture as used in a Brazilian sandwich. Spread very thinly in a loose wide oval just a few millimeters deep. NOT yellow pasta, NOT noodles, NOT long smooth strands, NOT french fries, NOT a cylindrical or thick molded chicken patty.

### cebola-v2

A few very thin real WHITE onion half-moon slivers, translucent pearly edges, natural wet texture, delicate curved slices, loosely scattered flat in one shallow wide oval. Only 5 or 6 delicate onion slivers, NOT a whole onion, NOT a pile of stacked rings, NOT thick onion rings, NOT a white bowl-shaped mound.

### catupiry-v2

A very thin smear of real Brazilian catupiry cream cheese spread, a flat wide oval of creamy off-white dairy with a naturally uneven front edge and a few subtle streaks from a butter knife. Real food texture, glossy cream. NOT a cake, NOT a coiled rope, NOT a piped swirl, NOT a mound, NOT whipped cream.

Verificação da revisão compacta anterior: 7 testes de regressão de geometria e cobertura de ingredientes, além de inspeção no navegador com todos os 15 ingredientes, quantidades repetidas e frango/cebola. O modelo de preços e os dados de pedidos/estoque não foram alterados.

## Revisão: montagem aberta e fechamento — 20/10/2026

A montagem fica aberta durante a escolha. O pão superior se eleva e inclina; “Finalizar montagem” aproxima e fecha o pão em 850 ms e abre a revisão de entrega após a animação. Alterar um ingrediente volta ao modo aberto. Movimento reduzido respeitado. A transição não cria nem envia pedidos.

Removidos os recortes de faixas frontais e máscaras retangulares. Cada ingrediente usa sua silhueta alfa completa, com proporções preservadas e sobreposição. As quantidades exatas permanecem no resumo. As carnes usam composições fotográficas próprias para uma, duas, três e quatro unidades; a mesma foto de uma carne não é clonada em andares. Milho e ervilha foram refeitos em porções pequenas.

Assets fotorrealistas gerados por IA via ImageGen, ilustrativos; não são fotos de produtos reais da hamburgueria. Originais anteriores preservados. Caminhos finais abaixo, relativos ao projeto `point-delivery/`.

### Base do prompt das carnes

Use case: product-mockup. Premium realistic food advertising photograph cutout for a burger configurator. Genuine transparent alpha background, no surface, no plate, no cast shadow, no bread, no cheese, no vegetables, no text, no watermark. Entire food silhouette visible with clear transparent margins. FRONT SIDE VIEW, camera only 3 degrees above horizontal, not overhead. Warm studio light from upper left, real cooked beef texture, juicy irregular caramelized edges, very slight natural asymmetry. The patties are thin Brazilian griddled burger patties, about 7mm thick each, broad and flat, not thick gourmet steak rounds. Wide landscape image. Primary subject: 

### public/ingredients/carne-1-v3.png

Exactly ONE thin real cooked beef hamburger patty. A shallow low profile, wide diameter, natural irregular seared edges and fine meat texture. Not cylindrical, not inflated, not a puck.

### public/ingredients/carne-2-v3.png

Exactly TWO thin real cooked beef hamburger patties nestled together as ONE compact photographed pair. Each patty has its own different organic shape and sear pattern; very slight horizontal offset of a few millimeters, natural contact and soft self-shadow between them. Both patties identifiable at front. No identical cloned rings or repeated texture. Total stack stays low and broad, about 15mm high at 110mm diameter.

### public/ingredients/carne-3-v3.png

Exactly THREE thin real cooked beef hamburger patties nestled naturally as ONE compact photographed group. Individual irregular edges, varied meat textures, slightly offset relative to each other, organic asymmetry, soft natural self-shadows between patties. No cloned concentric rings, no identical repeated texture. Low and broad: about 22mm total height at 110mm diameter. Three actual patties, NOT a tower of thick steak rounds.

### public/ingredients/carne-4-v3.png

Exactly FOUR thin real cooked beef hamburger patties nestled naturally as ONE compact photographed group, as used in a real quadruple smash burger. Four subtly different irregular edges visible, varied sear and meat texture, tiny natural horizontal offsets, soft self-shadows. Low and broad: roughly 28mm total height at 110mm diameter. NOT four cloned discs, NOT concentric ridged rings, NOT an accordion, NOT a barrel, NOT a tall cylinder.

### Base do prompt dos vegetais

Use case: product-mockup. One premium photorealistic studio food cutout for a Brazilian burger configurator. Transparent background, real alpha, no plate, no surface, no shadow, no other ingredients, no text, no watermark. Camera front view only 5 degrees above the horizontal. Soft natural warm studio light from upper left. A SMALL scattered topping, NOT a pile, NOT a mound, NOT a patty shape, NOT a thick oval disc. The whole food visible with generous margins. Primary subject: 

### public/ingredients/milho-verde-v3.png

about twelve actual sweetcorn kernels, yellow, juicy, naturally uneven, loosely scattered almost side by side in ONE shallow horizontal cluster, only one kernel deep. Small transparent spaces between some kernels. Like a modest spoonful of corn spread across a sandwich. No corn on the cob.

### public/ingredients/ervilha-v3.png

about ten actual cooked green peas, tender natural green texture with slight wrinkles, moist surface, loosely scattered almost side by side as ONE shallow horizontal cluster, only one pea deep. Small transparent spaces between some peas. Not a heap, no pea pods.

## Revisão: complementos em escala natural — 20/10/2026

O usuário rejeitou a batata em bloco e os grãos grandes sobrepostos à salada. Novos assets fotorrealistas gerados pelo ImageGen integrado: um grão de milho, uma ervilha e um pequeno conjunto aberto de fios de batata palha. Os originais anteriores foram preservados. O manifesto conserva as miniaturas de porção de milho/ervilha, enquanto a montagem usa os grãos individuais. A miniatura de batata usa os fios soltos.

O compositor desenha os grãos com 9–13 unidades de largura, frente ao pão de 330; batata em pequenos grupos de 48–62. As quantidades extras aumentam a densidade, sem ampliar os grãos nem criar uma camada. Parte dos complementos fica atrás da alface e parte aparece entre as bordas dos recheios. A cebola foi acomodada abaixo da borda da salada, evitando o aspecto de prato branco que acentuava a montagem artificial. Silhuetas alfa integrais; sem cortes retangulares ou achatamento. Contagem e preços mantidos.

Prompts finais e caminhos (relativos a point-delivery/):

### public/ingredients/milho-grao-v4.png

Use case: product-mockup. Asset type: single ingredient photographic cutout for a realistic burger configurator. A single real cooked sweetcorn kernel, only ONE small yellow kernel, photographed at macro scale so its natural irregular plump shape and moist surface can be seen clearly. FRONT SIDE VIEW, camera nearly horizontal, soft warm studio light from upper left matching food advertising photography. Genuine transparent alpha background. Whole object visible in center, generous transparent margins. No shadow on any surface, no bread, no bowl, no plate, no other kernels, no text, no watermark. Real food, not illustration, not 3D render.

### public/ingredients/ervilha-grao-v4.png

Use case: product-mockup. Asset type: single ingredient photographic cutout for a realistic burger configurator. A single real cooked green pea, only ONE pea, at macro scale, tender slightly wrinkled organic green skin with a tiny moist sheen, natural olive spring green, not artificial neon, no face or stylization. FRONT SIDE VIEW, camera nearly horizontal, soft warm studio light from upper left matching food advertising photography. Genuine transparent alpha background. Whole object visible in center, generous transparent margins. No surface, no cast shadow, no bowl, no plate, no other peas, no text, no watermark. Real food photograph, not illustration, not 3D render.

### public/ingredients/batata-palha-solta-v4.png

Use case: product-mockup. Asset type: delicate photographic ingredient cutout for a realistic Brazilian burger configurator. A very sparse loose scattering of exactly SIX short real Brazilian batata palha potato matchsticks, uneven lengths and slightly bent shapes, golden lightly fried crisp natural potato texture. Each strand is extremely thin, about 1 mm thick and 10-20 mm long. Six separate tiny strands loosely adjacent and crossing in only one or two spots, most areas between strands transparent. Irregular airy open silhouette in a wide shallow horizontal arrangement, NOT a mound, NOT a nest, NOT a solid layer, NOT a patty shape, NOT a dense portion, NOT long regular french fries. FRONT SIDE VIEW, camera 5 degrees above horizontal. Soft warm studio light upper left. Genuine transparent alpha background, whole scattering visible with margins, no plate, no surface, no shadow, no other food, no text, no watermark. Real close-up food photograph, not drawing or 3D render.



