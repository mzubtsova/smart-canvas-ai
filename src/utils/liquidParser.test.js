import { describe, expect, it } from 'vitest';
import { analyzeLiquidTemplate, parseLiquid } from './liquidParser';

const context = {
  user: {
    first_name: 'Marina',
    membership_tier: 'Gold',
    favorite_flavor: 'oreo',
    points_balance: 1250,
    is_vip: true
  }
};

describe('parseLiquid', () => {
  it('renders variables with default and text filters', () => {
    const html = '{{ user.first_name }} likes {{ user.favorite_flavor | uppercase }} and {{ user.city | default: "Austin" | capitalize }}';

    expect(parseLiquid(html, context)).toBe('Marina likes OREO and Austin');
  });

  it('evaluates nested conditionals and comparisons', () => {
    const html = `{% if user.is_vip %}
      {% if user.points_balance >= 1000 %}VIP reward{% else %}VIP starter{% endif %}
    {% else %}Standard reward{% endif %}`;

    expect(parseLiquid(html, context).replace(/\s+/g, ' ').trim()).toBe('VIP reward');
  });

  it('uses else branches when conditions fail', () => {
    const html = '{% if user.membership_tier == "Silver" %}Silver{% else %}Not silver{% endif %}';

    expect(parseLiquid(html, context)).toBe('Not silver');
  });
});

describe('analyzeLiquidTemplate', () => {
  it('flags unsupported tags and missing endif blocks', () => {
    const result = analyzeLiquidTemplate('{% if user.is_vip %}Hi{% for item in items %}{{ user.first_name }}');

    expect(result.variables).toContain('user.first_name');
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        '1 conditional block missing {% endif %}.',
        'Unsupported Liquid tag in sandbox preview: {% for item in items %}'
      ])
    );
  });
});
