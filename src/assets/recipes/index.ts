// Recipe image mapping: recipe DB id → local image import
import antipasti from './antipasti.jpg';
import bagels from './bagels.jpg';
import batataTzeluya from './batata-tzeluya.jpg';
import batskAlim from './batsk-alim.jpg';
import batskBrioche from './batsk-brioche.jpg';
import batskFocaccia from './batsk-focaccia.jpg';
import batskLachmaniyot from './batsk-lachmaniyot.jpg';
import batskPrich from './batsk-prich.jpg';
import batskShkedim from './batsk-shkedim.jpg';
import bokerTsarfati from './boker-tsarfati.jpg';
import briocheMaluach from './brioche-malu-ach.jpg';
import eggplantFilling from './eggplant-filling.jpg';
import fruitPlatter from './fruit-platter.jpg';
import glutenFreeRoll from './gluten-free-roll.jpg';
import krantzChocolate from './krantz-chocolate.jpg';
import krantzPistachio from './krantz-pistachio.jpg';
import lachmaniyotBis from './lachmaniyot-bis.jpg';
import lechemMachmetzet from './lechem-machmetzet.jpg';
import maafeAlim from './maafe-alim.jpg';
import miniCroissantSandwich from './mini-croissant-sandwich.jpg';
import miniCroissant from './mini-croissant.jpg';
import miniTortillas from './mini-tortillas.jpg';
import muesli from './muesli.jpg';
import muffinsBatata from './muffins-batata.jpg';
import ozneyPil from './ozney-pil.jpg';
import pizzaYeladim from './pizza-yeladim.jpg';
import sandwichFocaccia from './sandwich-focaccia.jpg';
import sandwichSourdough from './sandwich-sourdough.jpg';
import tapenade from './tapenade.jpg';
import vegetablePlatter from './vegetable-platter.jpg';

export const recipeImages: Record<string, string> = {
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
};
