// Mixins
import { factory as GroupableFactory } from '../../mixins/groupable'

// Utilities
import mixins from '../../util/mixins'
import { consoleWarn } from '../../util/console'

// Types
import { VNode, ScopedSlotChildren } from 'vue/types/vnode'

export default mixins(
  GroupableFactory('itemGroup', 'v-item', 'v-item-group')
  /* @vue/component */
).extend({
  name: 'v-item',

  props: {
    value: {
      required: false
    }
  },

  render (): VNode {
    if (!this.$scopedSlots.default) {
      consoleWarn('v-item is missing a default scopedSlot', this)

      return null as any
    }

    let element: VNode | ScopedSlotChildren

    /* istanbul ignore else */
    if (this.$scopedSlots.default) {
      element = this.$scopedSlots.default({
        active: this.isActive,
        toggle: this.toggle
      })
    }

    if (Array.isArray(element) && element.length === 1) {
      element = element[0]
    }

    if (!element || Array.isArray(element) || !element.tag) {
      consoleWarn('v-item should only contain a single element', this)

      return element as any
    }

    element.data = this._b(element.data || {}, element.tag!, {
      class: { [this.activeClass]: this.isActive }
    })

    return element
  }
})
