// Styles
import './VNavigationDrawer.sass'

// Components
import VImg, { srcObject } from '../VImg/VImg'

// Mixins
import Applicationable from '../../mixins/applicationable'
import Colorable from '../../mixins/colorable'
import Dependent from '../../mixins/dependent'
import Overlayable from '../../mixins/overlayable'
import SSRBootable from '../../mixins/ssr-bootable'
import Themeable from '../../mixins/themeable'

// Directives
import ClickOutside from '../../directives/click-outside'
import Resize from '../../directives/resize'
import Touch, { TouchWrapper } from '../../directives/touch'

// Utilities
import { convertToUnit, getSlot } from '../../util/helpers'
import mixins from '../../util/mixins'

// TYpes
import { VNode } from 'vue/types/vnode'
import { PropValidator } from 'vue/types/options'

const baseMixins = mixins(
  Applicationable('left', [
    'isActive',
    'isMobile',
    'miniVariant',
    'openOnHover',
    'permanent',
    'right',
    'temporary',
    'width'
  ]),
  Colorable,
  Dependent,
  Overlayable,
  SSRBootable,
  Themeable
)

/* @vue/component */
export default baseMixins.extend({
  name: 'v-navigation-drawer',

  directives: {
    ClickOutside,
    Resize,
    Touch
  },

  props: {
    bottom: Boolean,
    clipped: Boolean,
    disableRouteWatcher: Boolean,
    disableResizeWatcher: Boolean,
    height: {
      type: [Number, String],
      default: '100vh'
    },
    floating: Boolean,
    miniVariant: Boolean,
    miniVariantWidth: {
      type: [Number, String],
      default: 56
    },
    mobileBreakPoint: {
      type: [Number, String],
      default: 1264
    },
    permanent: Boolean,
    openOnHover: Boolean,
    right: Boolean,
    src: {
      type: [String, Object],
      default: ''
    } as PropValidator<string | srcObject>,
    stateless: Boolean,
    temporary: Boolean,
    touchless: Boolean,
    width: {
      type: [Number, String],
      default: 256
    },
    value: { required: false } as PropValidator<any>
  },

  data: () => ({
    isActive: false,
    isMouseover: false,
    touchArea: {
      left: 0,
      right: 0
    }
  }),

  computed: {
    /**
     * Used for setting an app value from a dynamic
     * property. Called from applicationable.js
     */
    applicationProperty (): string {
      return this.right ? 'right' : 'left'
    },
    classes (): object {
      return {
        'v-navigation-drawer': true,
        'v-navigation-drawer--absolute': this.absolute,
        'v-navigation-drawer--bottom': this.bottom,
        'v-navigation-drawer--clipped': this.clipped,
        'v-navigation-drawer--close': !this.isActive,
        'v-navigation-drawer--fixed': !this.absolute && (this.app || this.fixed),
        'v-navigation-drawer--floating': this.floating,
        'v-navigation-drawer--is-mobile': this.isMobile,
        'v-navigation-drawer--is-mouseover': this.isMouseover,
        'v-navigation-drawer--mini-variant': this.miniVariant || this.openOnHover,
        'v-navigation-drawer--open': this.isActive,
        'v-navigation-drawer--open-on-hover': this.openOnHover,
        'v-navigation-drawer--right': this.right,
        'v-navigation-drawer--temporary': this.temporary,
        ...this.themeClasses
      }
    },
    computedMaxHeight (): number | null {
      if (!this.hasApp) return null

      const computedMaxHeight = (
        this.$vuetify.application.bottom +
        this.$vuetify.application.footer +
        this.$vuetify.application.bar
      )

      if (!this.clipped) return computedMaxHeight

      return computedMaxHeight + this.$vuetify.application.top
    },
    computedTop (): number {
      if (!this.hasApp) return 0

      let computedTop = this.$vuetify.application.bar

      computedTop += this.clipped
        ? this.$vuetify.application.top
        : 0

      return computedTop
    },
    computedTransform (): number {
      if (this.isActive) return 0
      if (this.bottom && this.isMobile) return 100
      return this.right ? 100 : -100
    },
    computedWidth (): string | number {
      if (
        (this.openOnHover && !this.isMouseover) ||
        this.miniVariant
      ) return this.miniVariantWidth

      return this.width
    },
    hasApp (): boolean {
      return this.app &&
        (!this.isMobile && !this.temporary)
    },
    isMobile (): boolean {
      return (
        !this.stateless &&
        !this.permanent &&
        !this.temporary &&
        this.$vuetify.breakpoint.width < parseInt(this.mobileBreakPoint, 10)
      )
    },
    reactsToClick (): boolean {
      return !this.stateless &&
        !this.permanent &&
        (this.isMobile || this.temporary)
    },
    reactsToMobile (): boolean {
      return !this.disableResizeWatcher &&
        !this.stateless &&
        !this.permanent &&
        !this.temporary
    },
    reactsToResize (): boolean {
      return !this.disableResizeWatcher && !this.stateless
    },
    reactsToRoute (): boolean {
      return !this.disableRouteWatcher &&
        !this.stateless &&
        (this.temporary || this.isMobile)
    },
    showOverlay (): boolean {
      return this.isActive &&
        (this.isMobile || this.temporary)
    },
    styles (): object {
      const translate = this.bottom && this.isMobile ? 'translateY' : 'translateX'
      const styles = {
        height: convertToUnit(this.height),
        top: convertToUnit(this.computedTop),
        maxHeight: this.computedMaxHeight != null
          ? `calc(100% - ${convertToUnit(this.computedMaxHeight)})`
          : undefined,
        transform: `${translate}(${convertToUnit(this.computedTransform, '%')})`,
        width: convertToUnit(this.computedWidth)
      }

      return styles
    }
  },

  watch: {
    $route () {
      if (this.reactsToRoute && this.closeConditional()) {
        this.isActive = false
      }
    },
    isActive (val) {
      this.$emit('input', val)
    },
    /**
     * When mobile changes, adjust the active state
     * only when there has been a previous value
     */
    isMobile (val, prev) {
      !val &&
        this.isActive &&
        !this.temporary &&
        this.removeOverlay()

      if (prev == null ||
        !this.reactsToResize ||
        !this.reactsToMobile
      ) return

      this.isActive = !val
    },
    permanent (val) {
      // If enabling prop enable the drawer
      if (val) this.isActive = true
    },
    showOverlay (val) {
      if (val) this.genOverlay()
      else this.removeOverlay()
    },
    value (val) {
      if (this.permanent) return

      if (val == null) {
        this.init()
        return
      }

      if (val !== this.isActive) this.isActive = val
    }
  },

  beforeMount () {
    this.init()
  },

  methods: {
    calculateTouchArea () {
      const parent = this.$el.parentNode as Element

      if (!parent) return

      const parentRect = parent.getBoundingClientRect()

      this.touchArea = {
        left: parentRect.left + 50,
        right: parentRect.right - 50
      }
    },
    closeConditional () {
      return this.isActive && this.reactsToClick
    },
    genAppend () {
      const slot = getSlot(this, 'append')

      if (!slot) return slot

      return this.$createElement('div', {
        staticClass: 'v-navigation-drawer__append'
      }, slot)
    },
    genBackground () {
      const props = {
        height: '100%',
        width: '100%',
        src: this.src
      }

      const image = this.$scopedSlots.img
        ? this.$scopedSlots.img({ props })
        : this.$createElement(VImg, { props })

      return this.$createElement('div', {
        staticClass: 'v-navigation-drawer__image'
      }, [image])
    },
    genDirectives () {
      const directives = [{
        name: 'click-outside',
        value: () => (this.isActive = false),
        args: {
          closeConditional: this.closeConditional,
          include: this.getOpenDependentElements
        }
      }]

      !this.touchless && directives.push({
        name: 'touch',
        value: {
          parent: true,
          left: this.swipeLeft,
          right: this.swipeRight
        }
      } as any)

      return directives
    },
    genPrepend () {
      const slot = getSlot(this, 'prepend')

      if (!slot) return slot

      return this.$createElement('div', {
        staticClass: 'v-navigation-drawer__prepend'
      }, slot)
    },
    genContent () {
      return this.$createElement('div', {
        staticClass: 'v-navigation-drawer__content'
      }, this.$slots.default)
    },
    genBorder () {
      return this.$createElement('div', {
        staticClass: 'v-navigation-drawer__border'
      })
    },
    /**
     * Sets state before mount to avoid
     * entry transitions in SSR
     */
    init () {
      if (this.permanent) {
        this.isActive = true
      } else if (this.stateless ||
        this.value != null
      ) {
        this.isActive = this.value
      } else if (!this.temporary) {
        this.isActive = !this.isMobile
      }
    },
    swipeLeft (e: TouchWrapper) {
      if (this.isActive && this.right) return
      this.calculateTouchArea()

      if (Math.abs(e.touchendX - e.touchstartX) < 100) return
      if (this.right &&
        e.touchstartX >= this.touchArea.right
      ) this.isActive = true
      else if (!this.right && this.isActive) this.isActive = false
    },
    swipeRight (e: TouchWrapper) {
      if (this.isActive && !this.right) return
      this.calculateTouchArea()

      if (Math.abs(e.touchendX - e.touchstartX) < 100) return
      if (!this.right &&
        e.touchstartX <= this.touchArea.left
      ) this.isActive = true
      else if (this.right && this.isActive) this.isActive = false
    },
    /**
     * Update the application layout
     */
    updateApplication () {
      if (
        !this.isActive ||
        this.temporary ||
        this.isMobile ||
        !this.$el
      ) return 0

      const width = Number(this.computedWidth)

      return isNaN(width) ? this.$el.clientWidth : width
    }
  },

  render (h): VNode {
    const children = [
      this.genPrepend(),
      this.genContent(),
      this.genAppend(),
      this.genBorder()
    ]

    if (this.src || this.$scopedSlots.img) children.unshift(this.genBackground())

    return h('aside', this.setBackgroundColor(this.color, {
      class: this.classes,
      style: this.styles,
      directives: this.genDirectives(),
      on: {
        click: () => {
          if (!this.miniVariant) return

          this.$emit('update:miniVariant', false)
        },
        mouseenter: () => (this.isMouseover = true),
        mouseleave: () => (this.isMouseover = false),
        transitionend: (e: Event) => {
          if (e.target !== e.currentTarget) return
          this.$emit('transitionend', e)

          // IE11 does not support new Event('resize')
          const resizeEvent = document.createEvent('UIEvents')
          resizeEvent.initUIEvent('resize', true, false, window, 0)
          window.dispatchEvent(resizeEvent)
        }
      }
    }), children)
  }
})
