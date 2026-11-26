# Fotos de bebidas — 24/11/2026

Completadas 22 imagens: três copos de 300 ml (cupuaçu, graviola e goiaba), duas águas genéricas sem marca e 17 embalagens de bebidas. Seis imagens comerciais com alpha aproveitado; 11 recortes feitos pela ferramenta integrada imagegen a partir de referências reais. Suco e água gerados também pela ferramenta integrada, sempre com transparent_background=true. Não houve uso da API/CLI de geração.

Os produtos de marca usam referências comerciais identificáveis. Coca-Cola original em lata e 1 L, as quatro fotos anteriores dos sucos da lista atual e as oito porções existentes foram preservadas. Cacau antigo conserva seu mapeamento se voltar a ser publicado. Cadastro genérico Batata frita usa a foto existente da Tradicional; preço, estoque e disponibilidade permanecem intactos. Produtos futuros sem associação explícita não recebem marcas ou fotos por aproximação.

Padrão: produto isolado em recipiente ou embalagem, alpha real, canvas quadrado de 512 px, enquadramento proporcional com margem e WebP otimizado. As 22 novas imagens somam 658.888 bytes. Cada bebida tem estoque e preço anteriores preservados; nenhuma migração ou alteração de banco. Associação por ID em point-delivery/components/beverage-photos.json. Imagens em point-delivery/public/images/accompaniments/beverages-v2/. Originais PNG, prompts exatos e fontes em output/menu-photos-2026-11-24/.

Água não tinha marca ou volume informados: as duas imagens são ilustrativas genéricas com indicação sem gás/com gás, sem marca ou volume inventados. Guaraná é ilustrado por Antarctica, Monster pela lata Original e Skinka pela embalagem Fresh de laranja; não houve mudança de nome ou volume no cadastro nem alegação de fotografia da unidade física da hamburgueria. Extração por IA é uma edição da referência comercial; não é uma garantia de preservação pixel a pixel.

Miniaturas das opções de bebidas: 128 px no computador e 88 px em telas de até 600 px, com imagem inteira. Movimentação padrão, pausa, quantidades, ordem, categorias e preços preservados.

## Fontes por produto

| ID | Processo | Referência |
|---|---|---|
| suco-cupuacu-300ml | Geração imagegen | Imagem ilustrativa própria |
| suco-graviola-300ml | Geração imagegen | Imagem ilustrativa própria |
| suco-goiaba-300ml | Geração imagegen | Imagem ilustrativa própria |
| agua-sem-gas | Geração imagegen | Imagem ilustrativa própria |
| agua-com-gas | Geração imagegen | Imagem ilustrativa própria |
| coca-zero-1-litro | Recorte imagegen de foto comercial | [Fonte](https://www.imigrantesbebidas.com.br/refrigerante?page=2) |
| pepsi-1-litro | Recorte imagegen de foto comercial | [Fonte](https://www.imigrantesbebidas.com.br/pepsi) |
| coca-zero-lata | Recorte imagegen de foto comercial | [Fonte](https://www.imigrantesbebidas.com.br/refrigerante) |
| guarana-lata | Recorte imagegen de foto comercial | [Fonte](https://www.imigrantesbebidas.com.br/refrigerante) |
| guarana-zero-lata | Recorte imagegen de foto comercial | [Fonte](https://www.imigrantesbebidas.com.br/refrigerante) |
| pepsi-lata | Recorte imagegen de foto comercial | [Fonte](https://www.imigrantesbebidas.com.br/pepsi) |
| guarana-mini-pet | Recorte imagegen de foto comercial | [Fonte](https://www.imigrantesbebidas.com.br/refrigerante?page=2) |
| pepsi-mini-pet | Recorte imagegen de foto comercial | [Fonte](https://www.imigrantesbebidas.com.br/pepsi) |
| fanta-1-litro | Recorte imagegen de foto comercial | [Fonte](https://www.paguemenos.com.br/refrigerante-fanta-laranja-pet-1l/p) |
| fanta-mini-pet | Recorte imagegen de foto comercial | [Fonte](https://www.imigrantesbebidas.com.br/refrigerante-fanta-laranja-200ml) |
| suco-skinka-laranja | Recorte imagegen de foto comercial | [Fonte](https://produto.mercadolivre.com.br/MLB-2643087051-suco-de-laranja-skinka-zero-acucares-e-calorias-450ml-_JM) |
| guarana-1-litro | Foto comercial com alpha | [Fonte](https://praso.com.br/products/guarana-antarctica-1l-pack-c-12) |
| suco-del-valle-laranja | Foto comercial com alpha | [Fonte](https://portfoliococacolafemsa.com.br/parana/marca/del-valle) |
| coca-600ml | Foto comercial com alpha | [Fonte](https://portfoliococacolafemsa.com.br/parana/marca/coca-cola) |
| coca-mini-pet | Foto comercial com alpha | [Fonte](https://portfoliococacolafemsa.com.br/parana/marca/coca-cola) |
| fanta-lata | Foto comercial com alpha | [Fonte](https://portfoliococacolafemsa.com.br/parana/marca/fanta) |
| monster | Foto comercial com alpha | [Fonte](https://portfoliococacolafemsa.com.br/parana/marca/monster) |

## Prompts e reprodução

Prompts exatos em [prompts.json](../../output/menu-photos-2026-11-24/prompts.json). juiceBase substitui CONTENT por juiceContents de cada sabor e usa a foto antiga do suco de laranja como referência de forma/iluminação. waterBase substitui CONTENT por waterContents,sem referência de marca. cutoutFirstBatch foi usado para Coca Zero1L,Pepsi1L,Coca Zero lata e Guaraná lata;cutout para os demais recortes. skinka registra a iteração final de450ml. Rejeitada a variante anterior com indicação350ml.Não usada arte plana de rótulo Fanta encontrada entre as mídias do fornecedor.

Verificação:28bebidas cadastradas com foto local,alpha e orçamento de transferência testados automaticamente. Navegador real localhost4178 confirmou28imagens carregadas nas oito categorias,movimento ligado por padrão,pausa/animação none e retorno do movimento;adicionar/remover produto sem finalizar pedido;320/390/1366px sem overflow,console sem erros.Capturas work/menu-beverages-mobile.jpg e menu-beverages-desktop.jpg. localhost foi usado porque127.0.0.1 tem restrição do Next em assets de desenvolvimento;configuração de produção não foi alterada.

Alterações locais;publicação GitHub/Vercel pendente.
