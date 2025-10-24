// Enum for keypoints
export const POSE_LANDMARKS = {
    nose: 0,
    left_eye_inner: 1,
    left_eye: 2,
    left_eye_outer: 3,
    right_eye_inner: 4,
    right_eye: 5,
    right_eye_outer: 6,
    left_ear: 7,
    right_ear: 8,
    mouth_left: 9,
    mouth_right: 10,
    left_shoulder: 11,
    right_shoulder: 12,
    left_elbow: 13,
    right_elbow: 14,
    left_wrist: 15,
    right_wrist: 16,
    left_pinky: 17,
    right_pinky: 18,
    left_index: 19,
    right_index: 20,
    left_thumb: 21,
    right_thumb: 22,
    left_hip: 23,
    right_hip: 24,
    left_knee: 25,
    right_knee: 26,
    left_ankle: 27,
    right_ankle: 28,
    left_heel: 29,
    right_heel: 30,
    left_foot_index: 31,
    right_foot_index: 32,
};

// Define connections for drawing the skeleton
export const POSE_CONNECTIONS: [string, string][] = [
    ['nose', 'left_eye_inner'],
    ['left_eye_inner', 'left_eye'],
    ['left_eye', 'left_eye_outer'],
    ['left_eye_outer', 'left_ear'],
    ['nose', 'right_eye_inner'],
    ['right_eye_inner', 'right_eye'],
    ['right_eye', 'right_eye_outer'],
    ['right_eye_outer', 'right_ear'],
    ['mouth_left', 'mouth_right'],
    ['left_shoulder', 'right_shoulder'],
    ['left_shoulder', 'left_hip'],
    ['right_shoulder', 'right_hip'],
    ['left_hip', 'right_hip'],
    // Left Arm
    ['left_shoulder', 'left_elbow'],
    ['left_elbow', 'left_wrist'],
    ['left_wrist', 'left_pinky'],
    ['left_wrist', 'left_index'],
    ['left_wrist', 'left_thumb'],
    ['left_pinky', 'left_index'],
    // Right Arm
    ['right_shoulder', 'right_elbow'],
    ['right_elbow', 'right_wrist'],
    ['right_wrist', 'right_pinky'],
    ['right_wrist', 'right_index'],
    ['right_wrist', 'right_thumb'],
    ['right_pinky', 'right_index'],
    // Left Leg
    ['left_hip', 'left_knee'],
    ['left_knee', 'left_ankle'],
    ['left_ankle', 'left_heel'],
    ['left_ankle', 'left_foot_index'],
    ['left_heel', 'left_foot_index'],
    // Right Leg
    ['right_hip', 'right_knee'],
    ['right_knee', 'right_ankle'],
    ['right_ankle', 'right_heel'],
    ['right_ankle', 'right_foot_index'],
    ['right_heel', 'right_foot_index'],
];

type AngleRule = {
    p1: string;
    p2: string;
    p3: string;
    angle: { min: number; max: number };
    feedback: string;
};

type Stage = {
    rules: {
        [key: string]: AngleRule;
    };
};

type WorkoutData = {
    stages: {
        [key: string]: Stage;
    };
};

export const WORKOUTS_DATA: { [key: string]: WorkoutData } = {
    SQUAT: {
        stages: {
            down: {
                rules: {
                    knee: {
                        p1: 'left_hip', p2: 'left_knee', p3: 'left_ankle',
                        angle: { min: 70, max: 110 },
                        feedback: "You're not going low enough. Try to break parallel."
                    },
                    back: {
                        p1: 'left_shoulder', p2: 'left_hip', p3: 'left_knee',
                        angle: { min: 80, max: 120 },
                        feedback: "Keep your chest up and back straight."
                    }
                }
            },
            up: {
                rules: {
                     knee: {
                        p1: 'left_hip', p2: 'left_knee', p3: 'left_ankle',
                        angle: { min: 160, max: 190 },
                        feedback: "Stand up all the way to complete the rep."
                    },
                     back: {
                        p1: 'left_shoulder', p2: 'left_hip', p3: 'left_knee',
                        angle: { min: 160, max: 190 },
                        feedback: "Keep your back straight as you stand up."
                    }
                }
            }
        }
    },
    STANDING: {
        stages: {
            up: {
                rules: {
                    knee: {
                        p1: 'left_hip', p2: 'left_knee', p3: 'left_ankle',
                        angle: { min: 170, max: 190 },
                        feedback: "Your knees are slightly bent."
                    },
                    hip: {
                        p1: 'left_shoulder', p2: 'left_hip', p3: 'left_knee',
                        angle: { min: 170, max: 190 },
                        feedback: "You are leaning forward slightly."
                    }
                }
            }
        }
    }
};
