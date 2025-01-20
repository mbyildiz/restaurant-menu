import { useEffect, useState } from 'react';
import { Droppable, DroppableProps, DroppableProvided, DroppableStateSnapshot } from '@hello-pangea/dnd';

interface StrictModeDroppableProps extends Omit<DroppableProps, 'children'> {
    children: (provided: DroppableProvided, snapshot: DroppableStateSnapshot) => React.ReactNode;
}

export const StrictModeDroppable = ({ children, ...props }: StrictModeDroppableProps) => {
    const [isEnabled, setIsEnabled] = useState(false);

    useEffect(() => {
        setIsEnabled(true);
        return () => setIsEnabled(false);
    }, []);

    if (!isEnabled) {
        return null;
    }

    return (
        <Droppable {...props}>
            {(provided, snapshot) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                    {children(provided, snapshot)}
                    {provided.placeholder}
                </div>
            )}
        </Droppable>
    );
}; 