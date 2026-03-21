import { Extension } from '@tiptap/core'

/**
 * Extensión para soportar estilos APA 7 en TipTap.
 * Permite aplicar la clase 'apa-reference' para la sangría francesa.
 */
export const APA7 = Extension.create({
  name: 'apa7',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph'],
        attributes: {
          class: {
            default: null,
            parseHTML: element => element.getAttribute('class'),
            renderHTML: attributes => {
              if (!attributes.class) return {}
              return { class: attributes.class }
            },
          },
        },
      },
    ]
  },
})
