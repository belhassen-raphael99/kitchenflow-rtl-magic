// Recipe image mapping: recipe DB id → local image import
// Bakery
import ozneyPil from './ozney-pil.jpg';
import bokerTsarfati from './boker-tsarfati.jpg';
import batskBrioche from './batsk-brioche.jpg';
import batskLachmaniyot from './batsk-lachmaniyot.jpg';
import batskAlim from './batsk-alim.jpg';
import batskFocaccia from './batsk-focaccia.jpg';
import batskPrich from './batsk-prich.jpg';
import batskShkedim from './batsk-shkedim.jpg';
import briocheMaluach from './brioche-malu-ach.jpg';
import lechemMachmetzet from './lechem-machmetzet.jpg';
import maafeAlim from './maafe-alim.jpg';
import miniCroissantSandwich from './mini-croissant-sandwich.jpg';
import pizzaYeladim from './pizza-yeladim.jpg';
import krantzPistachio from './krantz-pistachio.jpg';
import krantzChocolate from './krantz-chocolate.jpg';

// Kitchen
import antipasti from './antipasti.jpg';
import batataTzeluya from './batata-tzeluya.jpg';
import bagels from './bagels.jpg';
import tapenade from './tapenade.jpg';
import sandwichSourdough from './sandwich-sourdough.jpg';
import sandwichFocaccia from './sandwich-focaccia.jpg';
import lachmaniyotBis from './lachmaniyot-bis.jpg';
import glutenFreeRoll from './gluten-free-roll.jpg';
import muffinsBatata from './muffins-batata.jpg';
import vegetablePlatter from './vegetable-platter.jpg';
import fruitPlatter from './fruit-platter.jpg';
import muesli from './muesli.jpg';
import eggplantFilling from './eggplant-filling.jpg';
import miniTortillas from './mini-tortillas.jpg';
import miniCroissant from './mini-croissant.jpg';
import miniPotatoes from './mini-potatoes.jpg';
import mixSandwiches from './mix-sandwiches.jpg';
import eggSalad from './egg-salad.jpg';
import tunaSalad from './tuna-salad.jpg';
import greekSalad from './greek-salad.jpg';
import greenSalad from './green-salad.jpg';
import tomatoSalad from './tomato-salad.jpg';
import pastaSalad from './pasta-salad.jpg';
import quinoaSalad from './quinoa-salad.jpg';
import caesarSalad from './caesar-salad.jpg';
import thaiSalad from './thai-salad.jpg';
import grapeLeaves from './grape-leaves.jpg';
import chouxSavory from './choux-savory.jpg';
import roastedMushrooms from './roasted-mushrooms.jpg';
import pastaTomato from './pasta-tomato.jpg';
import pastaPesto from './pasta-pesto.jpg';
import pastaRose from './pasta-rose.jpg';
import pesto from './pesto.jpg';
import pretzels from './pretzels.jpg';
import croutons from './croutons.jpg';
import crostini from './crostini.jpg';
import ravioli from './ravioli.jpg';
import greekDressing from './greek-dressing.jpg';
import saladDressing from './salad-dressing.jpg';
import tomatoSauce from './tomato-sauce.jpg';
import caesarDressing from './caesar-dressing.jpg';
import roseSauce from './rose-sauce.jpg';
import mushroomCreamSauce from './mushroom-cream-sauce.jpg';
import pestoCreamSauce from './pesto-cream-sauce.jpg';
import thaiSauce from './thai-sauce.jpg';
import royalQuiche from './royal-quiche.jpg';
import salmonSkewers from './salmon-skewers.jpg';

// Patisserie
import laminatedDough from './laminated-dough.jpg';
import brownies from './brownies.jpg';
import granola from './granola.jpg';
import lemonTartlet from './lemon-tartlet.jpg';
import lemonCups from './lemon-cups.jpg';
import pistachioTartlet from './pistachio-tartlet.jpg';
import fruitTartlet from './fruit-tartlet.jpg';
import chocolateTartlet from './chocolate-tartlet.jpg';
import blackTartletMozz from './black-tartlet-mozz.jpg';
import blackTartletSalmon from './black-tartlet-salmon.jpg';
import appleTartlet from './apple-tartlet.jpg';
import tiramisu from './tiramisu.jpg';
import truffles from './truffles.jpg';
import chocolateBalls from './chocolate-balls.jpg';
import dateBalls from './date-balls.jpg';
import chocolateMousse from './chocolate-mousse.jpg';
import malabi from './malabi.jpg';
import mascarponeCups from './mascarpone-cups.jpg';
import almondCrescents from './almond-crescents.jpg';
import chocChipCookies from './choc-chip-cookies.jpg';
import carrotCake from './carrot-cake.jpg';
import honeyCake from './honey-cake.jpg';
import vanillaOrangeCake from './vanilla-orange-cake.jpg';
import chouxSweet from './choux-sweet.jpg';
import financier from './financier.jpg';
import parmesanCrisps from './parmesan-crisps.jpg';
import quicheBatata from './quiche-batata.jpg';
import quicheMediterranean from './quiche-mediterranean.jpg';
import quicheMushroom from './quiche-mushroom.jpg';
import quichePeppers from './quiche-peppers.jpg';
import quicheSpinach from './quiche-spinach.jpg';
import cantuccini from './cantuccini.jpg';
import cocoaCrumble from './cocoa-crumble.jpg';
import lemonCurd from './lemon-curd.jpg';
import almondCream from './almond-cream.jpg';
import snowWhite from './snow-white.jpg';
import chantilly from './chantilly.jpg';

export const recipeImages: Record<string, string> = {
  // Bakery
  '08ac385b-34b6-4a77-be73-c64dad28fca8': ozneyPil,
  '080d9702-5c88-4bb7-8e3e-aede8381375c': bokerTsarfati,
  '6459866f-be88-4e6e-8e1c-b6ea969732ce': batskBrioche,
  '07973413-d3fd-443b-addd-625f4ea21b6e': batskLachmaniyot,
  '1b338a24-f517-4270-9afe-7daaadf4e1a7': batskAlim,
  '160a1bf0-da8b-43ba-bf9f-101460e7dae0': batskFocaccia,
  '209f4758-fd2f-4ba6-ac55-32ac84619ea5': batskPrich,
  '216b1c84-2b35-4763-9972-5cb402a84341': batskShkedim,
  '4b287584-050b-4859-956a-6006b08c59e0': briocheMaluach,
  '7c0d55d0-0f83-4987-a435-d4dee4348608': lechemMachmetzet,
  'a6133f2d-b61a-44a8-b2d6-87bf7fcd1ee4': maafeAlim,
  '891fe075-0b06-48a8-9c35-23489d669690': miniCroissantSandwich,
  '1bd8199a-547e-4194-9a4e-23c22c3afbaa': pizzaYeladim,
  '3ccea7f8-8b68-4bfa-87be-e4ee4a93f04f': krantzPistachio,
  'dd613fe3-b83f-41a5-bd8f-8f581ba1386f': krantzChocolate,

  // Kitchen
  '26332e80-9daa-4939-bfc2-565cc2d5829d': antipasti,
  'c249e392-967f-4f39-8fc3-cf7af3200a13': batataTzeluya,
  '10a103c2-2adf-4e4a-a82e-f14802350a82': bagels,
  '076805a3-98fa-4fce-b8b2-9f55ee7b6965': tapenade,
  '65bcaa48-331f-4cac-8e81-148eddb55ac6': sandwichSourdough,
  '0f5251bf-209e-4d42-a6e6-82913e347b75': sandwichFocaccia,
  '467d0311-89ff-4aa9-8977-77ca3f20a39a': lachmaniyotBis,
  '1d5f41e3-04ee-48e1-8163-fae52730a4b7': glutenFreeRoll,
  '27c252b6-b007-457c-9905-933c8907e824': muffinsBatata,
  '9c03e639-d490-43b2-8cd7-b626ef8c0c84': vegetablePlatter,
  '956c0896-deac-4a5d-a23f-90ed51bf59fa': fruitPlatter,
  '6a2ef224-5473-49c0-a0ae-8952144479de': muesli,
  '48010f4d-9084-4b9c-b80a-821dc8b5e2fb': eggplantFilling,
  '6d77e574-877c-4283-8a23-fba89cf0c179': miniTortillas,
  '097f9550-f691-482d-9af2-34dd945a6dd4': miniCroissant,
  '1ebd4349-0bf2-4cdc-ba06-26e287ff6285': miniPotatoes,
  '15bb3b69-7d37-4eb0-beba-f2f7ec23cc0f': mixSandwiches,
  '45bdd0f3-12b5-4c82-a4d1-22f57f15d45d': eggSalad,
  'af7fc1d5-476b-4e8f-910b-e5b8c75faa97': tunaSalad,
  '0b8da90e-a180-4662-b21d-d6f841376dd9': greekSalad,
  '0f632341-3021-4cbe-8629-f30e5aa836b6': greenSalad,
  '81f23d7e-2db4-4c17-acef-b3b823bf3727': tomatoSalad,
  '926e4405-bd7a-4975-8da0-e717f88e60cc': pastaSalad,
  'c5cbba54-b0dc-44d5-8aa9-32da61e633cc': quinoaSalad,
  '97ef4e2d-8998-4ce3-85d4-6ef66a8969b7': caesarSalad,
  '0b3927d3-b322-403f-a819-d15d306563a8': thaiSalad,
  '8666919d-a1fd-4445-84c2-05b15a924391': grapeLeaves,
  '1f22b4ac-81a9-4118-b389-2d35cdc91873': chouxSavory,
  'c581338d-087a-4bbb-b9e7-94e245320154': roastedMushrooms,
  'b8346ecd-5f3b-45cd-a5ad-5f4301175105': pastaTomato,
  '2c28eb92-e290-4798-a534-bed1466497b6': pastaPesto,
  '395b2e02-3265-47fa-9a42-44d43f45ee07': pastaRose,
  '3c1935bd-dec8-4964-bc69-75060b0c0abf': pesto,
  '88726aea-803b-4b99-9be2-3a53315e2045': pretzels,
  '0e7b2f68-7067-493b-bc64-cf0f2d81b4ca': croutons,
  'a2968518-d250-4491-8d05-4eb342611134': crostini,
  '571e14eb-66a4-4183-9996-8d0771e4018b': ravioli,
  '62324a4c-8627-4270-aebd-df57f25d7e43': greekDressing,
  '974cf259-378c-413f-81c3-faf240ba60ff': saladDressing,
  '70bddf98-e2be-4951-a42f-ba36104c6c64': tomatoSauce,
  '0a42fba3-1e3b-42f2-b763-0a5a8e769b07': caesarDressing,
  '9fc28d38-1710-45fa-8c7e-4d85eab70aba': roseSauce,
  '06265972-5ca5-41aa-877d-311e5747b4bb': mushroomCreamSauce,
  '3dd96ae5-6ab4-4aae-af6a-79343b9a9695': pestoCreamSauce,
  'b99705d3-a987-48b3-9273-81fb8b268e06': thaiSauce,
  '58bb2ef6-5c2a-407f-9959-41814f0a61fc': royalQuiche,
  'af606f5d-72d9-4f27-92a9-473dceb69f03': salmonSkewers,

  // Patisserie
  '71faae9d-ff2e-49b7-9177-aea5279cf468': laminatedDough,
  '2cc1e28e-2179-41b9-b633-1dec9c9b247d': brownies,
  '889889bc-7e4e-4cb7-b60f-865e3812ddf0': granola,
  '87152c0f-f6ec-47fe-b53b-af310cfb7462': lemonTartlet,
  '0f68923a-e3a9-4664-a719-bb6cf296638b': lemonCups,
  '229585c9-b33a-4829-942e-ff35eb8069ee': pistachioTartlet,
  'b2f739fd-6735-4a05-9681-5a6f35332a2a': fruitTartlet,
  '3385fe4b-7e4a-411d-b08b-191016db54fb': chocolateTartlet,
  '9621918e-03df-45d2-9517-59f5983dce48': blackTartletMozz,
  '01761e64-8dbd-4f1b-a35c-53cbc9b0d045': blackTartletSalmon,
  '534966ec-a1e7-44c6-b9fb-0250cf408bd5': appleTartlet,
  '71436aa1-f2f9-4134-a6e5-0b46f6a1a178': tiramisu,
  '1633a47b-b626-4561-a7fd-2a5034e4081f': truffles,
  '70a4e70f-374a-402b-b035-aaf5000744ff': chocolateBalls,
  '34a37ca7-e225-444a-b82e-883bd0b6f0a1': dateBalls,
  '2303c4e1-9353-4e11-80e0-9ea0c0628733': chocolateMousse,
  '386c5833-48e5-4343-870a-b105cf07a97f': malabi,
  '29c894e9-def0-4785-b8bc-97a7457c8bc4': mascarponeCups,
  '1152f8f1-80ac-4a5a-8334-6587a31fc8b8': almondCrescents,
  '19feef31-1efb-4d99-8c84-7cb1a4746888': chocChipCookies,
  '38a268bb-1904-4bea-81c5-81fdfaf5ef02': carrotCake,
  '7a0bdfe0-bc96-487b-923d-d8612790cd40': honeyCake,
  '6a98b078-466f-431b-b93b-e3f8b008e07f': vanillaOrangeCake,
  'cf17b7c2-7aaa-4aa2-96e0-ca15f95c5b71': chouxSweet,
  '4620ee55-5353-4926-996e-5afeaab2800e': financier,
  '8d0f86f8-de08-4773-a34c-13ce079fe90c': parmesanCrisps,
  '56038027-659a-4679-b765-e42863dc050d': quicheBatata,
  '0f62d0d5-318d-4a77-be1b-a8d8f8e11fe3': quicheMediterranean,
  '4bc1a670-ded7-47d3-be45-2e4e2eebb08b': quicheMushroom,
  '556e8cde-2dab-4057-a428-805d28bb9595': quichePeppers,
  '12f958ba-5c03-4e00-8dc8-b555e7987759': quicheSpinach,
  '69e0e055-da0b-4548-9526-c54085d1a599': cantuccini,
  '33bc4255-f2f0-49e3-8d48-3e2fe7434d5d': cocoaCrumble,
  '385c7735-e2ce-4cad-844f-66d8d2833614': lemonCurd,
  '2dbe1add-3c8b-4107-8c4e-696b5086c36f': almondCream,
  '0379ed88-98c5-4d41-887a-c52beb937deb': snowWhite,
  '1835267e-b22d-4774-a120-662fc7e078c5': chantilly,
};
