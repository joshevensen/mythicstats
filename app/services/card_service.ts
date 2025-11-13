import Card from '#models/card'
import CardVariant from '#models/card_variant'

export default class CardService {
  async updateCard(cardId: number, updates: Partial<Card>) {
    const card = await Card.findOrFail(cardId)
    card.merge(updates)
    await card.save()
    return card
  }

  async updateCardVariant(variantId: number, updates: Partial<CardVariant>) {
    const variant = await CardVariant.findOrFail(variantId)
    variant.merge(updates)
    await variant.save()
    return variant
  }
}
