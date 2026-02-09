import React from 'react';
import { motion, Variants } from 'framer-motion';

interface RevealProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    direction?: 'up' | 'down' | 'left' | 'right';
    duration?: number;
}

const getVariants = (direction: string, duration: number): Variants => {
    const offset = 30;
    const directions: Record<string, { x: number; y: number }> = {
        up: { x: 0, y: offset },
        down: { x: 0, y: -offset },
        left: { x: offset, y: 0 },
        right: { x: -offset, y: 0 },
    };

    const { x, y } = directions[direction] || directions.up;

    return {
        hidden: {
            opacity: 0,
            x,
            y,
        },
        visible: {
            opacity: 1,
            x: 0,
            y: 0,
            transition: {
                type: 'spring',
                stiffness: 100,
                damping: 15,
                duration,
            },
        },
    };
};

export const Reveal: React.FC<RevealProps> = ({
    children,
    className,
    delay = 0,
    direction = 'up',
    duration = 0.5,
}) => {
    return (
        <motion.div
            className={className}
            variants={getVariants(direction, duration)}
            initial="hidden"
            animate="visible"
            transition={{ delay }}
        >
            {children}
        </motion.div>
    );
};

// Stagger container for multiple children
interface StaggerContainerProps {
    children: React.ReactNode;
    className?: string;
    staggerDelay?: number;
}

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1,
        },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 100,
            damping: 15,
        },
    },
};

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
    children,
    className,
    staggerDelay = 0.1,
}) => {
    return (
        <motion.div
            className={className}
            variants={{
                ...containerVariants,
                visible: {
                    ...containerVariants.visible,
                    transition: {
                        staggerChildren: staggerDelay,
                        delayChildren: 0.1,
                    },
                },
            }}
            initial="hidden"
            animate="visible"
        >
            {children}
        </motion.div>
    );
};

export const StaggerItem: React.FC<{ children: React.ReactNode; className?: string }> = ({
    children,
    className,
}) => {
    return (
        <motion.div className={className} variants={itemVariants}>
            {children}
        </motion.div>
    );
};

export default Reveal;
