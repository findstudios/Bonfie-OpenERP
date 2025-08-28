/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'media', // 使用媒體查詢檢測深色模式
  theme: {
    // 自定義斷點
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
      // 自定義響應式斷點
      'mobile': {'max': '767px'},
      'tablet': {'min': '768px', 'max': '1199px'},
      'desktop': {'min': '1200px'},
      // 方向斷點
      'portrait': {'raw': '(orientation: portrait)'},
      'landscape': {'raw': '(orientation: landscape)'},
      // 觸控裝置
      'touch': {'raw': '(hover: none) and (pointer: coarse)'},
      'no-touch': {'raw': '(hover: hover) and (pointer: fine)'},
    },
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        success: {
          500: '#10b981',
        },
        warning: {
          500: '#f59e0b',
        },
        error: {
          500: '#ef4444',
        },
        info: {
          500: '#06b6d4',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans TC', 'sans-serif'],
      },
      spacing: {
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
        // 響應式間距
        'sidebar-expanded': '16rem',
        'sidebar-collapsed': '4rem',
        'mobile-header': '3.5rem',
        'touch-target': '2.75rem', // 44px 最小觸控目標
      },
      // 響應式字體大小
      fontSize: {
        'xs-mobile': ['0.75rem', { lineHeight: '1rem' }],
        'sm-mobile': ['0.875rem', { lineHeight: '1.25rem' }],
        'base-mobile': ['1rem', { lineHeight: '1.5rem' }],
        'lg-mobile': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl-mobile': ['1.25rem', { lineHeight: '1.75rem' }],
      },
      // 響應式陰影
      boxShadow: {
        'mobile-card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'tablet-card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'desktop-card': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      // 響應式邊框半徑
      borderRadius: {
        'mobile': '0.375rem',
        'tablet': '0.5rem',
        'desktop': '0.75rem',
      },
      // 動畫和過渡
      transitionProperty: {
        'sidebar': 'width, margin, transform',
        'layout': 'margin, padding, width, height',
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
      },
      // Z-index 層級
      zIndex: {
        'sidebar': '40',
        'mobile-overlay': '30',
        'header': '50',
        'dropdown': '60',
        'modal': '70',
        'toast': '80',
      },
      // 響應式網格
      gridTemplateColumns: {
        'mobile-form': '1fr',
        'tablet-form': 'repeat(2, 1fr)',
        'desktop-form': 'repeat(3, 1fr)',
        'responsive-cards': 'repeat(auto-fit, minmax(280px, 1fr))',
        'responsive-table': 'repeat(auto-fit, minmax(200px, 1fr))',
      },
      // 響應式間隙
      gap: {
        'mobile': '0.5rem',
        'tablet': '1rem',
        'desktop': '1.5rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    // 自定義響應式工具類別
    function({ addUtilities, addComponents, theme }) {
      const newUtilities = {
        // 觸控目標最小尺寸
        '.touch-target': {
          minWidth: theme('spacing.touch-target'),
          minHeight: theme('spacing.touch-target'),
        },
        // 側邊欄寬度
        '.sidebar-expanded': {
          width: theme('spacing.sidebar-expanded'),
        },
        '.sidebar-collapsed': {
          width: theme('spacing.sidebar-collapsed'),
        },
        // 響應式容器
        '.container-responsive': {
          width: '100%',
          paddingLeft: theme('spacing.4'),
          paddingRight: theme('spacing.4'),
          '@screen sm': {
            paddingLeft: theme('spacing.6'),
            paddingRight: theme('spacing.6'),
          },
          '@screen lg': {
            paddingLeft: theme('spacing.8'),
            paddingRight: theme('spacing.8'),
          },
        },
        // 響應式文字截斷
        '.text-truncate-responsive': {
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          '@screen mobile': {
            whiteSpace: 'normal',
            display: '-webkit-box',
            '-webkit-line-clamp': '2',
            '-webkit-box-orient': 'vertical',
          },
        },
        // 響應式卡片
        '.card-responsive': {
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.mobile'),
          boxShadow: theme('boxShadow.mobile-card'),
          padding: theme('spacing.4'),
          '@screen md': {
            borderRadius: theme('borderRadius.tablet'),
            boxShadow: theme('boxShadow.tablet-card'),
            padding: theme('spacing.6'),
          },
          '@screen lg': {
            borderRadius: theme('borderRadius.desktop'),
            boxShadow: theme('boxShadow.desktop-card'),
            padding: theme('spacing.8'),
          },
        },
        // 響應式佈局工具
        '.layout-responsive': {
          transition: 'margin 250ms ease-in-out',
          '@screen mobile': {
            marginLeft: '0',
            paddingTop: theme('spacing.mobile-header'),
          },
          '@screen tablet': {
            paddingTop: '0',
          },
        },
        // 響應式網格
        '.grid-responsive-cards': {
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: theme('spacing.4'),
          '@screen sm': {
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: theme('spacing.6'),
          },
          '@screen lg': {
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: theme('spacing.8'),
          },
        },
        '.grid-responsive-form': {
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: theme('spacing.4'),
          '@screen md': {
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: theme('spacing.6'),
          },
          '@screen lg': {
            gridTemplateColumns: 'repeat(3, 1fr)',
          },
        },
        // 響應式間距
        '.space-responsive': {
          '& > * + *': {
            marginTop: theme('spacing.4'),
            '@screen md': {
              marginTop: theme('spacing.6'),
            },
            '@screen lg': {
              marginTop: theme('spacing.8'),
            },
          },
        },
        // 觸控優化
        '.touch-friendly': {
          minHeight: theme('spacing.touch-target'),
          minWidth: theme('spacing.touch-target'),
          padding: theme('spacing.2'),
          '@media (hover: none) and (pointer: coarse)': {
            padding: theme('spacing.3'),
          },
        },
      }
      
      // 響應式組件類別
      const newComponents = {
        '.btn-responsive': {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: theme('fontWeight.medium'),
          borderRadius: theme('borderRadius.mobile'),
          transition: 'all 150ms ease-in-out',
          minHeight: theme('spacing.touch-target'),
          minWidth: theme('spacing.touch-target'),
          padding: `${theme('spacing.2')} ${theme('spacing.4')}`,
          fontSize: theme('fontSize.sm'),
          '@screen md': {
            borderRadius: theme('borderRadius.tablet'),
            padding: `${theme('spacing.3')} ${theme('spacing.6')}`,
            fontSize: theme('fontSize.base'),
          },
          '@screen lg': {
            borderRadius: theme('borderRadius.desktop'),
          },
          '&:focus': {
            outline: 'none',
            boxShadow: `0 0 0 2px ${theme('colors.primary.500')}`,
          },
        },
        '.input-responsive': {
          width: '100%',
          borderWidth: '1px',
          borderColor: theme('colors.gray.300'),
          borderRadius: theme('borderRadius.mobile'),
          padding: `${theme('spacing.2')} ${theme('spacing.3')}`,
          fontSize: theme('fontSize.sm'),
          minHeight: theme('spacing.touch-target'),
          transition: 'all 150ms ease-in-out',
          '@screen md': {
            borderRadius: theme('borderRadius.tablet'),
            padding: `${theme('spacing.3')} ${theme('spacing.4')}`,
            fontSize: theme('fontSize.base'),
          },
          '@screen lg': {
            borderRadius: theme('borderRadius.desktop'),
          },
          '&:focus': {
            outline: 'none',
            borderColor: theme('colors.primary.500'),
            boxShadow: `0 0 0 1px ${theme('colors.primary.500')}`,
          },
        },
      }
      
      addUtilities(newUtilities)
      addComponents(newComponents)
    },
  ],
}