export interface ProfileRequirement {
    key: string;
    label: string;
}

export const PROFILE_REQUIRED_FIELDS: ProfileRequirement[] = [
    {
        key: 'demographics.gender',
        label: 'Gender',
    },
    {
        key: 'demographics.birthDate',
        label: 'Date of Birth',
    },
];

export const PROFILE_GENDER_OPTIONS = ['Female', 'Male', 'Non-binary', 'Prefer not to say'];


