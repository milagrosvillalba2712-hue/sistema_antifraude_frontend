import type { ThemeConfig } from 'antd';

export const regulaTheme: ThemeConfig = {
  token: {
    colorPrimary: '#de7426',
    colorSuccess: '#2ecc71',
    colorWarning: '#f2994a',
    colorError: '#ba1a1a',
    colorInfo: '#00658d',
    colorTextBase: '#1a2a36',
    colorBgBase: '#f7f9fc',
    borderRadius: 8,
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    controlHeight: 38,
  },
  components: {
    Layout: {
      bodyBg: '#f7f9fc',
      siderBg: '#4e616e',
      headerBg: '#ffffff',
    },
    Menu: {
      darkItemBg: '#4e616e',
      darkItemSelectedBg: '#de7426',
      darkItemColor: 'rgba(255,255,255,0.72)',
      darkItemHoverColor: '#ffffff',
      darkItemSelectedColor: '#ffffff',
    },
    Table: {
      headerBg: '#f2f4f7',
      headerColor: '#4e616e',
      rowHoverBg: '#f7f9fc',
    },
    Modal: {
      borderRadiusLG: 10,
    },
    Card: {
      borderRadiusLG: 10,
    },
  },
};

export const severityTagColor = (severity?: string | null) => {
  switch ((severity || '').toUpperCase()) {
    case 'CRITICA':
      return 'red';
    case 'ALTA':
      return 'orange';
    case 'MEDIA':
      return 'gold';
    case 'BAJA':
      return 'blue';
    default:
      return 'default';
  }
};

export const alertStateTagColor = (state?: string | null) => {
  switch ((state || '').toUpperCase()) {
    case 'NUEVA':
      return 'gold';
    case 'ASIGNADA':
      return 'blue';
    case 'EN_REVISION':
      return 'processing';
    case 'PENDIENTE_APROBACION':
      return 'purple';
    case 'REEVALUACION':
      return 'volcano';
    case 'CERRADA':
      return 'green';
    default:
      return 'default';
  }
};
