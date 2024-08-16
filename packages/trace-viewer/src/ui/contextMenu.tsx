/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as React from 'react';
import './contextMenu.css';

type Position = {
  x: number
  y: number
};

type ContextMenuState<TItem> = {
  isOpened: true;
  position: Position
  item: TItem;
} | {
  isOpened: false;
  item?: undefined;
};

const defaultContextMenuState: ContextMenuState<unknown> = {
  isOpened: false,
};

export const useContextMenu = <TItem extends any>() => {
  const [contextMenuState, setContextMenuState] = React.useState<ContextMenuState<TItem>>(defaultContextMenuState);

  React.useEffect(() => {
    const closeContextMenu = (e: MouseEvent) => {
      e.stopPropagation();
      setContextMenuState(defaultContextMenuState);
    };

    document.addEventListener('click', closeContextMenu);
    return () => document.removeEventListener('click', closeContextMenu);
  }, []);

  const open = (item: TItem, e: React.MouseEvent) => {
    console.log(e);
    e.preventDefault();
    setContextMenuState({
      isOpened: true,
      position: { x: e.pageX, y: e.pageY },
      item,
    });
  };

  return {
    ...contextMenuState,
    open
  };
};

export const ContextMenu = ({ position, children }: { position: Position, children: React.ReactNode }) => {
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(0);
  const [height, setHeight] = React.useState(0);

  React.useLayoutEffect(() => {
    setWidth(menuRef.current?.clientWidth ?? 0);
    setHeight(menuRef.current?.clientHeight ?? 0);
  }, []);

  const finalPosition = React.useMemo(() => {
    const x = position.x + width > window.innerWidth ? position.x - width : position.x;
    const y = position.y + height > window.innerHeight ? position.y - height : position.y;

    return { x, y };
  }, [height, position.x, position.y, width]);

  return (
    <div className='context-menu-overlay'>
      <div className='context-menu' ref={menuRef} style={{ left: finalPosition.x, top: finalPosition.y }}>
        {children}
      </div>
    </div>
  );
};

export const ContextMenuItem = ({ children, onClick }: { children: React.ReactNode, onClick: () => void }) => {
  return (
    <div className='context-menu-item' onClick={onClick}>
      {children}
    </div>
  );
};
