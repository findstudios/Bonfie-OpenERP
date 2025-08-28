import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SimpleContactForm from '../SimpleContactForm.vue'
import type { ContactFormData } from '../types'

describe('SimpleContactForm', () => {
  it('should render contact form fields', () => {
    const contact: ContactFormData = {
      full_name: '',
      phone: '',
      email: '',
      address: '',
      relationship: '父親',
      is_primary: false,
      is_emergency: false,
      is_billing: false,
      notes: ''
    }

    const wrapper = mount(SimpleContactForm, {
      props: { contact }
    })

    // 檢查基本欄位是否存在
    expect(wrapper.find('input[name="full_name"]').exists()).toBe(true)
    expect(wrapper.find('input[name="phone"]').exists()).toBe(true)
    expect(wrapper.find('input[name="email"]').exists()).toBe(true)
    expect(wrapper.find('select[name="relationship"]').exists()).toBe(true)
  })

  it('should emit update event when input changes', async () => {
    const contact: ContactFormData = {
      full_name: '',
      phone: '',
      email: '',
      address: '',
      relationship: '父親',
      is_primary: false,
      is_emergency: false,
      is_billing: false,
      notes: ''
    }

    const wrapper = mount(SimpleContactForm, {
      props: { contact }
    })

    const nameInput = wrapper.find('input[name="full_name"]')
    await nameInput.setValue('張小明')

    // 檢查是否發射更新事件
    expect(wrapper.emitted('update:contact')).toBeTruthy()
    const emittedEvents = wrapper.emitted('update:contact') as any[]
    expect(emittedEvents[0][0].full_name).toBe('張小明')
  })

  it('should handle checkbox changes', async () => {
    const contact: ContactFormData = {
      full_name: '',
      phone: '',
      email: '',
      address: '',
      relationship: '父親',
      is_primary: false,
      is_emergency: false,
      is_billing: false,
      notes: ''
    }

    const wrapper = mount(SimpleContactForm, {
      props: { contact }
    })

    const primaryCheckbox = wrapper.find('input[type="checkbox"][name="is_primary"]')
    await primaryCheckbox.setValue(true)

    expect(wrapper.emitted('update:contact')).toBeTruthy()
    const emittedEvents = wrapper.emitted('update:contact') as any[]
    expect(emittedEvents[0][0].is_primary).toBe(true)
  })
})
