# Fotos do montador — referência da hero

## Revisão: fotografia suculenta com referência da hero — 20/10/2026

O usuário pediu o montador com o aspecto suculento da hero. A própria imagem `point-delivery/public/burger-hero.png` foi usada como referência visual no ImageGen integrado: crosta dourada com brilho natural, carnes caramelizadas com textura e umidade, queijo amarelo derretido, bacon com gordura brilhante e vegetais frescos. São imagens ilustrativas geradas por IA, não fotografias dos produtos reais do restaurante.

Dez fotos ativas foram salvas em `point-delivery/public/ingredients/`: pão superior/inferior, quatro composições de carne, queijo, cheddar, bacon e salada. Os arquivos anteriores foram preservados; cópia do manifesto anterior em `.sites-runtime/ingredient-photos-before-v5.json`. A salada tem alface sobre o tomate, como na hero. Miniaturas do cardápio usam os mesmos assets. A composição mantém a escolha dos ingredientes, os grãos/fios pequenos e a animação, sem alterar preços ou contagem. Não há imagem de lanche pronto substituindo as escolhas.

As composições de carne usam aliases estáveis carne-1 a carne-4; o arquivo versionado fica no manifesto. O arquivo ativo de duas carnes é v5b. Para quatro carnes foi mantido v5, após inspeção visual: duas tentativas de refinamento não preservaram quatro unidades discerníveis e foram rejeitadas. As fotos ativas mantêm exatamente 1, 2, 3 e 4 carnes. Os grupos maiores se acomodam em largura moderadamente menor, sem distorcer proporções; base do pão e enquadramento ajustados. Pontas do queijo ficam à mostra sob o bacon.

### Prompt base (geração com a hero como referência)

Use case: product-mockup. Create ONE photorealistic food photography cutout ingredient for an interactive burger builder. The attached burger hero image is a STYLE / LIGHTING / FOOD TEXTURE reference only, NOT the desired full subject. Match its appetizing rich warm caramel browns, glossy natural fresh-food highlights, tactile realistic texture and high-end advertising photography. One coordinated photo shoot, light from upper left, subtle fill from front right. Front three-quarter food view, camera only 8 degrees above horizontal; broad wide horizontal silhouette. Realistic food, not 3D/CGI, not illustration, not plastic. Genuine transparent alpha background, no plate, no surface, no cast shadow, no text or watermarks. Show entire requested subject with clear transparent margins. Do NOT include any of the OTHER burger ingredients visible in the reference. Primary subject: 

### point-delivery/public/ingredients/carne-1-v5.png

Exactly ONE juicy cooked BEEF burger patty with an irregular craggy browned front edge, distinct browned ground-beef granules and small glossy beads of rendered juice. Rich mahogany brown seared crust with darker caramelized spots and warm moist highlights, as delicious as the patty in the reference. No artificial parallel grill stripes. Wide patty, moderately thin, natural imperfect round shape. Whole photographed silhouette height about 25% of its width, not a tall puck. ONLY the single beef patty, NO cheese, NO bread, NO bacon, NO vegetables.

### point-delivery/public/ingredients/pao-topo-v5.png

Only the TOP HALF of a soft fresh sesame brioche hamburger bun. Match the reference's deep golden caramel brown glaze, shiny egg-washed crust and irregular natural sesame seeds, softly pillowy bread and tiny pores. Whole dome in view, broad rounded natural shape, gently irregular bottom cut edge with a subtle pale crumb rim. A low broad dome, whole silhouette height about 34% of its width. NOT orange plastic, NOT a matte industrial roll. Bread top only: no bottom half, no fillings, no vegetables, no meat.

### point-delivery/public/ingredients/queijo-v5.png

ONE freshly melted slice of real yellow burger cheese, a warm buttery golden yellow (not white), glossy soft surface, draped into a broad shallow round shape as if resting on a burger patty which must be COMPLETELY ABSENT. Three or four irregular tapered melted corners and gentle natural folds flowing downward in front, supple thin edges with small reflective highlights. Appetizing like the reference's melted cheese but slightly lighter yellow. Low wide profile, silhouette height about 22% of width. No stacked cheese block, no solid disc, no rubbery white edge. ONLY cheese, no meat or bread or other food.

### point-delivery/public/ingredients/carne-2-v5b.png

Refinamento integrado, com a foto de duas carnes v5 como alvo e a hero como referência:

Use case: precise-object-edit. Image 1 is the edit target: two isolated juicy beef patties. Image 2 is the reference for the warm rich food-advertising texture. Keep exactly TWO patties, rich caramelized browning, appetizing small juicy highlights, the same lighting, irregular ground-beef edges, natural contact and transparency. Make the patties physically THINNER and nestled more closely: two thin griddled burger patties rather than thick gourmet rounds. Broad diameter. Reduce total side-profile thickness by about one third while preserving a natural undistorted round top surface, real texture and proportion. Entire resulting food group silhouette height about 30% of width. Camera almost horizontal, only 3 degrees above it. Do not simply blur or stretch texture. No bread, cheese, vegetables, plate, surface, cast shadow, text or watermark. Real transparent alpha with full food silhouette and clear margin.

Prompt da foto v5 usada como alvo: Use case: product-mockup. Create ONE photorealistic food photography cutout ingredient for an interactive burger builder. The attached burger hero image is a STYLE / LIGHTING / FOOD TEXTURE reference only, NOT the desired full subject. Match its appetizing rich warm caramel browns, glossy natural fresh-food highlights, tactile realistic texture and high-end advertising photography. One coordinated photo shoot, light from upper left, subtle fill from front right. Front three-quarter food view, camera only 8 degrees above horizontal; broad wide horizontal silhouette. Realistic food, not 3D/CGI, not illustration, not plastic. Genuine transparent alpha background, no plate, no surface, no cast shadow, no text or watermarks. Show entire requested subject with clear transparent margins. Do NOT include any of the OTHER burger ingredients visible in the reference. Primary subject: Exactly TWO juicy thin beef burger patties nestled together as one coherent low broad photographed pair. Match the reference's rich mahogany sear, craggy caramelized ground-beef texture and small natural juicy highlights. Different organic edges and browning for each patty, slight horizontal offsets and real contact shadows. Total two-patty silhouette height about 29% of width. Juicy but not inflated, not a cylinder, no repeated molded ridges. ONLY two beef patties, no cheese, bread, vegetables or other food.

### point-delivery/public/ingredients/carne-3-v5.png

Exactly THREE juicy thin beef burger patties nestled as ONE coherent low broad photographed group. Match the reference's rich mahogany sear, irregular craggy caramelized ground-beef texture and small natural juicy highlights. Each patty has distinct organic edges and browning, tiny horizontal offsets, natural contact shadows. Total silhouette height about 33% of width. Three discernible patties, not identical cloned discs, not thick steak rounds, not a tall tower. ONLY three beef patties, no cheese, bread, vegetables or other food.

### point-delivery/public/ingredients/carne-4-v5.png

Exactly FOUR juicy thin beef burger patties nestled naturally as ONE coherent low broad photographed group. Match the reference's rich mahogany sear, craggy caramelized ground-beef texture and small natural juicy highlights. Distinct irregular edges and sear patterns on each patty, slight natural horizontal offsets and close contact. Total silhouette height about 36% of width, broad and compact. Four discernible thin patties, NOT identical molded ridges, NOT a barrel, NOT an accordion, NOT a tower. ONLY four beef patties, no cheese, bread, vegetables or other food.

### point-delivery/public/ingredients/pao-base-v5.png

Only the BOTTOM HALF of the sesame brioche hamburger bun in the reference. A wide low soft bread base, golden toasted rim and softly pale fluffy crumb along the cut top edge. Deep warm buttery golden exterior, subtle natural sheen, real tiny pores and caramelized toasted highlights. The exposed top cut surface only a narrow ellipse, viewed from nearly horizontal camera. Whole silhouette height about 20% of width, LOW and broad. Bread base only, no top dome, no sesame scattered on the cut face, no meat, cheese, lettuce, sauces or other food.

### point-delivery/public/ingredients/cheddar-v5.png

One thin layer of HOT MELTED CHEDDAR cheese, rich deep golden orange cheddar like in the reference. Supple shiny melted surface with gentle uneven folds and three or four distinct thin tapered corners hanging down at the front, natural small wet highlights. Wide shallow burger-width drape, as if on a patty which must be completely ABSENT. Whole silhouette about 21% as high as wide. Orange cheddar only, not a white slice, not cheese sauce piped into a solid mound, not a block, no meat, no bread, no bacon or vegetables.

### point-delivery/public/ingredients/bacon-v5.png

ONLY two overlapping strips of real cooked smoky BACON arranged loosely into one wide low burger topping. Match the reference's delicious reddish mahogany crisp caramelized edges, rippled wavy surface, translucent golden rendered fat and natural glossy juicy highlights. Natural folds and irregular tips extend sideways, no flat uniform meat sheet. Whole silhouette around 20% as high as wide. The two strips gently cross in the middle, not a dense heap. Bacon only, absolutely no bread, beef, cheese, salad or other ingredients.

### point-delivery/public/ingredients/salada-v5.png

ONLY one shallow burger topping of fresh CURLY GREEN LETTUCE ON TOP of TWO ripe red tomato slices, arranged exactly in the vertical order seen in the reference: green ruffled leaf ABOVE, red tomato edges BELOW and peeking from its front. Real crisp curled leaf edges, juicy tomato seed chambers, tiny natural moisture highlights. The leaf overlaps the BACK parts of the two tomato slices; their thick red front edges remain clearly visible below the lettuce. Wide, low natural arrangement for a burger, whole silhouette height about 28% of width. No giant ball of lettuce, no tall salad pile. Lettuce and tomato only, no bread, no meat, no bacon, no cheese, no sauce, no other garnish.

