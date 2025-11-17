/**
 * 动态图标加载工具
 * 避免一次性导入所有图标
 */

import React from 'react';

/**
 * 动态加载单个 Remix 图标
 * @param iconName 图标名称
 * @returns Promise<React.ComponentType | null>
 */
export const loadRemixIcon = async (iconName: string): Promise<React.ComponentType<any> | null> => {
	if (!iconName) return null;

	try {
		const icons = await import('@remixicon/react');
		const IconComponent = (icons as any)[iconName];
		
		if (IconComponent && typeof IconComponent === 'function') {
			return IconComponent;
		}
		
		return null;
	} catch (error) {
		console.error('Failed to load icon:', iconName, error);
		return null;
	}
};

/**
 * 同步获取所有图标（用于 IconSelector 组件）
 * 这个函数会导入所有图标，应该只在 IconSelector 中使用
 */
export const getAllRemixIcons = () => {
	return import('@remixicon/react');
};

