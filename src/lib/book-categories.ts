export type BookCategory = {
    name: string;
    subcategories?: BookCategory[];
};

export const BOOK_CATEGORIES: BookCategory[] = [
    {
        name: "Arts & Photography",
        subcategories: [
            {
                name: "Architecture",
                subcategories: [
                    { name: "Buildings" },
                    { name: "History & Periods" },
                    { name: "Interior Design" },
                    { name: "Landscape" },
                    { name: "Urban & Land Use Planning" }
                ]
            },
            {
                name: "Design & Decorative Arts",
                subcategories: [
                    { name: "Graphic Design" },
                    { name: "Industrial Design" },
                    { name: "Textile & Costume" },
                    { name: "Decorative Arts & Design" }
                ]
            },
            {
                name: "History & Criticism",
                subcategories: [
                    { name: "Criticism & Theory" },
                    { name: "History" },
                    { name: "Themes" }
                ]
            },
            {
                name: "Photography & Video",
                subcategories: [
                    { name: "Aerial" },
                    { name: "Architectural" },
                    { name: "Cinematography" },
                    { name: "Digital Photography" },
                    { name: "Fashion" },
                    { name: "Nature & Wildlife" },
                    { name: "Photojournalism" }
                ]
            },
            {
                name: "Music",
                subcategories: [
                    { name: "Instruments" },
                    { name: "Musical Genres" },
                    { name: "Songbooks" },
                    { name: "Theory, Composition & Performance" }
                ]
            },
            {
                name: "Performing Arts",
                subcategories: [
                    { name: "Dance" },
                    { name: "Film" },
                    { name: "Theater" },
                    { name: "Television" }
                ]
            }
        ]
    },
    {
        name: "Biographies & Memoirs",
        subcategories: [
            {
                name: "Arts & Literature",
                subcategories: [
                    { name: "Artists, Architects & Photographers" },
                    { name: "Authors" },
                    { name: "Composers & Musicians" },
                    { name: "Entertainers" }
                ]
            },
            { name: "Ethnic & Cultural" },
            {
                name: "Historical",
                subcategories: [
                    { name: "Africa" },
                    { name: "Asia" },
                    { name: "Europe" },
                    { name: "United States" },
                    { name: "Holocaust" }
                ]
            },
            { name: "Leaders & Notable People" },
            { name: "Memoirs" },
            {
                name: "Professionals & Academics",
                subcategories: [
                    { name: "Business" },
                    { name: "Educators" },
                    { name: "Journalists" },
                    { name: "Medical" },
                    { name: "Scientists" }
                ]
            },
            { name: "True Crime" }
        ]
    },
    {
        name: "Business & Money",
        subcategories: [
            { name: "Accounting" },
            { name: "Biography & History" },
            {
                name: "Economics",
                subcategories: [
                    { name: "Commercial Policy" },
                    { name: "Development" },
                    { name: "Economic History" },
                    { name: "Econometrics" },
                    { name: "Macroeconomics" },
                    { name: "Microeconomics" }
                ]
            },
            { name: "Education & Reference" },
            { name: "Entrepreneurship & Small Business" },
            { name: "Finance" },
            { name: "Industries" },
            { name: "International Business" },
            { name: "Investing" },
            { name: "Job Hunting & Careers" },
            { name: "Management & Leadership" },
            { name: "Marketing & Sales" },
            { name: "Personal Finance" },
            { name: "Real Estate" },
            { name: "Systems & Planning" },
            { name: "Technology" },
            { name: "Women & Business" }
        ]
    },
    {
        name: "Children's eBooks",
        subcategories: [
            { name: "Action & Adventure" },
            { name: "Animals" },
            { name: "Arts, Music & Photography" },
            { name: "Biographies" },
            { name: "Computers & Technology" },
            { name: "Early Learning" },
            { name: "Education & Reference" },
            { name: "Fairy Tales, Folk Tales & Myths" },
            { name: "Growing Up & Facts of Life" },
            { name: "History" },
            { name: "Holidays & Celebrations" },
            { name: "Humor" },
            { name: "Literature & Fiction" },
            { name: "Mysteries & Detectives" },
            { name: "Religions" },
            { name: "Science Fiction, Fantasy & Scary Stories" },
            { name: "Science, Nature & How It Works" },
            { name: "Sports & Outdoors" }
        ]
    },
    {
        name: "Comics & Graphic Novels",
        subcategories: [
            { name: "Graphic Novels" },
            {
                name: "Manga",
                subcategories: [
                    { name: "Fantasy" },
                    { name: "Horror" },
                    { name: "Media Tie-In" },
                    { name: "Mystery" },
                    { name: "Romance" },
                    { name: "Science Fiction" }
                ]
            },
            { name: "Superheroes" }
        ]
    },
    {
        name: "Computers & Technology",
        subcategories: [
            { name: "Business Technology" },
            { name: "Certification" },
            {
                name: "Computer Science",
                subcategories: [
                    { name: "AI & Machine Learning" },
                    { name: "Algorithms" },
                    { name: "Cybernetics" },
                    { name: "Human-Computer Interaction" },
                    { name: "Information Theory" }
                ]
            },
            { name: "Databases & Big Data" },
            { name: "Digital Audio, Video & Photography" },
            { name: "Graphics & Design" },
            { name: "Hardware & DIY" },
            { name: "History & Culture" },
            { name: "Internet & Social Media" },
            { name: "Mobile Phones, Tablets & E-Readers" },
            { name: "Networking & Cloud Computing" },
            { name: "Operating Systems" },
            {
                name: "Programming",
                subcategories: [
                    { name: "Algorithms" },
                    { name: "APIs & Operating Environments" },
                    { name: "C & C++" },
                    { name: "C#" },
                    { name: "Game Programming" },
                    { name: "Java" },
                    { name: "JavaScript" },
                    { name: "Mobile Development" },
                    { name: "Python" },
                    { name: "Software Design" },
                    { name: "Web Programming" }
                ]
            },
            { name: "Programming Languages" },
            { name: "Security & Encryption" },
            { name: "Software" },
            { name: "Web Development & Design" }
        ]
    },
    {
        name: "Cookbooks, Food & Wine",
        subcategories: [
            { name: "Asian Cooking" },
            { name: "Baking" },
            { name: "BBQ & Grilling" },
            { name: "Beverages & Wine" },
            { name: "Canning & Preserving" },
            { name: "Cooking by Ingredient" },
            { name: "Culinary Arts & Techniques" },
            { name: "Desserts" },
            { name: "Diet & Health" },
            { name: "European Cooking" },
            { name: "Latin American Cooking" },
            { name: "Meals" },
            { name: "Mediterranean Cooking" },
            { name: "Regional & International" },
            { name: "Special Diet" },
            { name: "Vegetarian & Vegan" }
        ]
    },
    {
        name: "Crafts, Hobbies & Home",
        subcategories: [
            { name: "Antiques & Collectibles" },
            { name: "Crafts & Hobbies" },
            { name: "Gardening & Landscape Design" },
            { name: "Home Improvement & Design" },
            { name: "Interior Design" },
            { name: "Pets & Animal Care" },
            { name: "Sustainable Living" }
        ]
    },
    {
        name: "Education & Teaching",
        subcategories: [
            { name: "Schools & Teaching" },
            { name: "Studying & Workbooks" },
            { name: "Teacher Resources" },
            { name: "Higher & Continuing Education" },
            { name: "Test Preparation" }
        ]
    },
    {
        name: "Engineering & Transportation",
        subcategories: [
            { name: "Automotive" },
            { name: "Engineering" },
            { name: "Transportation" }
        ]
    },
    {
        name: "Fiction",
        subcategories: [
            { name: "Action & Adventure" },
            { name: "African American" },
            { name: "Alternative History" },
            { name: "Anthologies" },
            { name: "Asian American" },
            { name: "Biographical" },
            { name: "Christian" },
            { name: "Classics" },
            { name: "Contemporary" },
            { name: "Crime" },
            {
                name: "Fantasy",
                subcategories: [
                    { name: "Alternative History" },
                    { name: "Arthurian" },
                    { name: "Dark" },
                    { name: "Dragons & Mythical Creatures" },
                    { name: "Epic" },
                    { name: "Fairy Tales" },
                    { name: "Gaslamp" },
                    { name: "Historical" },
                    { name: "Military" },
                    { name: "Myths & Legends" },
                    { name: "Paranormal & Urban" },
                    { name: "Sword & Sorcery" },
                    { name: "TV, Movie & Video Game Adaptations" }
                ]
            },
            { name: "Historical Fiction" },
            {
                name: "Horror",
                subcategories: [
                    { name: "Comedy" },
                    { name: "Dark Fantasy" },
                    { name: "Ghosts" },
                    { name: "Occult" },
                    { name: "Psychological" },
                    { name: "Zombies" }
                ]
            },
            { name: "Humor & Satire" },
            { name: "Literary" },
            { name: "Metaphysical & Visionary" },
            {
                name: "Mystery, Thriller & Suspense",
                subcategories: [
                    { name: "Comedy" },
                    { name: "Conspiracy" },
                    { name: "Crime" },
                    { name: "Domestic" },
                    { name: "Hard-Boiled" },
                    { name: "Historical" },
                    { name: "Legal" },
                    { name: "Medical" },
                    { name: "Military" },
                    { name: "Police Procedurals" },
                    { name: "Political" },
                    { name: "Psychological" },
                    { name: "Spy" },
                    { name: "Technothrillers" }
                ]
            },
            { name: "Poetry" },
            {
                name: "Romance",
                subcategories: [
                    { name: "Billionaires" },
                    { name: "Clean & Wholesome" },
                    { name: "Contemporary" },
                    { name: "Fantasy" },
                    { name: "Gothic" },
                    { name: "Historical" },
                    { name: "Holidays" },
                    { name: "Inspirational" },
                    { name: "LGBTQ+" },
                    { name: "Military" },
                    { name: "Multicultural" },
                    { name: "New Adult" },
                    { name: "Paranormal" },
                    { name: "Romantic Comedy" },
                    { name: "Science Fiction" },
                    { name: "Sports" },
                    { name: "Suspense" },
                    { name: "Time Travel" },
                    { name: "Westerns" }
                ]
            },
            {
                name: "Science Fiction",
                subcategories: [
                    { name: "Adventure" },
                    { name: "Alien Contact" },
                    { name: "Alternative History" },
                    { name: "Cyberpunk" },
                    { name: "Dystopian" },
                    { name: "Galactic Empire" },
                    { name: "Hard Science Fiction" },
                    { name: "Military" },
                    { name: "Post-Apocalyptic" },
                    { name: "Space Exploration" },
                    { name: "Space Opera" },
                    { name: "Steampunk" },
                    { name: "Time Travel" }
                ]
            },
            { name: "Short Stories" },
            { name: "War & Military" },
            { name: "Westerns" },
            { name: "Women's Fiction" },
            { name: "World Literature" }
        ]
    },
    {
        name: "Health, Fitness & Dieting",
        subcategories: [
            { name: "Addiction & Recovery" },
            { name: "Aging" },
            { name: "Alternative Medicine" },
            { name: "Beauty, Grooming & Style" },
            { name: "Counseling & Psychology" },
            { name: "Diets & Weight Loss" },
            { name: "Diseases & Physical Ailments" },
            { name: "Exercise & Fitness" },
            { name: "Men's Health" },
            { name: "Mental Health" },
            { name: "Nutrition" },
            { name: "Personal Health" },
            { name: "Safety & First Aid" },
            { name: "Sexual Health" },
            { name: "Sports Health & Safety" },
            { name: "Teen Health" },
            { name: "Vaccinations" },
            { name: "Women's Health" }
        ]
    },
    {
        name: "History",
        subcategories: [
            { name: "Africa" },
            { name: "Americas" },
            { name: "Ancient Civilizations" },
            { name: "Arctic & Antarctica" },
            { name: "Asia" },
            { name: "Australia & Oceania" },
            { name: "Europe" },
            { name: "Historical Study & Educational Resources" },
            { name: "Middle East" },
            { name: "Military" },
            { name: "Modern" },
            { name: "Russia" },
            { name: "United States" },
            { name: "World" }
        ]
    },
    {
        name: "Humor & Entertainment",
        subcategories: [
            { name: "Activities, Puzzles & Games" },
            { name: "Humor" },
            { name: "Movies" },
            { name: "Music" },
            { name: "Performing Arts" },
            { name: "Pop Culture" },
            { name: "Radio" },
            { name: "Television" }
        ]
    },
    {
        name: "Law",
        subcategories: [
            { name: "Administrative Law" },
            { name: "Business" },
            { name: "Constitutional Law" },
            { name: "Criminal Law" },
            { name: "Environmental & Natural Resources Law" },
            { name: "Estate Planning" },
            { name: "Family Law" },
            { name: "Foreign & International Law" },
            { name: "Intellectual Property" },
            { name: "Law Practice" },
            { name: "Legal Education" },
            { name: "Legal History" },
            { name: "Legal Self-Help" },
            { name: "Legal Theory & Systems" },
            { name: "Media & the Law" },
            { name: "Tax Law" }
        ]
    },
    {
        name: "LGBTQ+ eBooks",
        subcategories: [
            { name: "Biographies & Memoirs" },
            { name: "History" },
            { name: "Literature & Fiction" },
            { name: "Mystery, Thriller & Suspense" },
            { name: "Nonfiction" },
            { name: "Parenting & Relationships" },
            { name: "Romance" },
            { name: "Science Fiction & Fantasy" },
            { name: "Travel" }
        ]
    },
    {
        name: "Medical eBooks",
        subcategories: [
            { name: "Administration & Medicine Economics" },
            { name: "Allied Health Professions" },
            { name: "Basic Sciences" },
            { name: "Clinical" },
            { name: "Dentistry" },
            { name: "History" },
            { name: "Internal Medicine" },
            { name: "Nursing" },
            { name: "Pharmacology" },
            { name: "Psychology" },
            { name: "Public Health" },
            { name: "Research" },
            { name: "Veterinary Medicine" }
        ]
    },
    {
        name: "Parenting & Relationships",
        subcategories: [
            { name: "Aging Parents" },
            { name: "Family Activities" },
            { name: "Family Health" },
            { name: "Family Relationships" },
            { name: "Fertility" },
            { name: "Marriage & Long-Term Relationships" },
            { name: "Parenting" },
            { name: "Pregnancy & Childbirth" },
            { name: "Reference" },
            { name: "Special Needs" }
        ]
    },
    {
        name: "Politics & Social Sciences",
        subcategories: [
            { name: "Anthropology" },
            { name: "Archaeology" },
            { name: "Philosophy" },
            {
                name: "Politics & Government",
                subcategories: [
                    { name: "Elections & Political Process" },
                    { name: "Ideologies & Doctrines" },
                    { name: "International Relations" },
                    { name: "Practical Politics" },
                    { name: "Public Affairs & Policy" },
                    { name: "Specific Topics" }
                ]
            },
            { name: "Social Sciences" },
            { name: "Sociology" },
            { name: "Women's Studies" }
        ]
    },
    {
        name: "Religion & Spirituality",
        subcategories: [
            { name: "Agnosticism" },
            { name: "Atheism" },
            { name: "Buddhism" },
            { name: "Christianity" },
            { name: "Hinduism" },
            { name: "Islam" },
            { name: "Judaism" },
            { name: "New Age & Spirituality" },
            { name: "Occult & Paranormal" },
            { name: "Religious Studies & Reference" }
        ]
    },
    {
        name: "Science & Math",
        subcategories: [
            { name: "Agricultural Sciences" },
            { name: "Astronomy & Space Science" },
            { name: "Behavioral Sciences" },
            { name: "Biological Sciences" },
            { name: "Chemistry" },
            { name: "Earth Sciences" },
            { name: "Environment" },
            { name: "Essays & Commentary" },
            { name: "Evolution" },
            { name: "Experiments, Instruments & Measurement" },
            { name: "History & Philosophy" },
            { name: "Mathematics" },
            { name: "Nature & Ecology" },
            { name: "Physics" },
            { name: "Reference" },
            { name: "Technology" }
        ]
    },
    {
        name: "Self-Help",
        subcategories: [
            { name: "Abuse" },
            { name: "Anxieties & Phobias" },
            { name: "Creativity" },
            { name: "Death & Grief" },
            { name: "Dreams" },
            { name: "Eating Disorders" },
            { name: "Happiness" },
            { name: "Hypnosis" },
            { name: "Inner Child" },
            { name: "Journal Writing" },
            { name: "Memory Improvement" },
            { name: "Motivational" },
            { name: "Personal Transformation" },
            { name: "Relationships" },
            { name: "Self-Esteem" },
            { name: "Sex" },
            { name: "Spiritual" },
            { name: "Stress Management" },
            { name: "Success" }
        ]
    },
    {
        name: "Sports & Outdoors",
        subcategories: [
            { name: "Baseball" },
            { name: "Basketball" },
            { name: "Coaching" },
            { name: "Extreme Sports" },
            { name: "Football" },
            { name: "Golf" },
            { name: "Hiking & Camping" },
            { name: "Hockey" },
            { name: "Hunting & Fishing" },
            { name: "Individual Sports" },
            { name: "Mountaineering" },
            { name: "Outdoor Recreation" },
            { name: "Racket Sports" },
            { name: "Soccer" },
            { name: "Training" },
            { name: "Water Sports" },
            { name: "Winter Sports" }
        ]
    },
    {
        name: "Teen & Young Adult",
        subcategories: [
            { name: "Arts, Music & Photography" },
            { name: "Biographies" },
            { name: "Comics & Graphic Novels" },
            { name: "Computers" },
            { name: "Education & Reference" },
            { name: "Historical Fiction" },
            { name: "Hobbies & Games" },
            { name: "Horror" },
            { name: "Humor" },
            { name: "Literature & Fiction" },
            { name: "Mysteries & Thrillers" },
            { name: "Personal Health" },
            { name: "Poetry" },
            {
                name: "Religion & Spirituality",
                subcategories: [
                    { name: "Christian" },
                    { name: "Eastern" },
                    { name: "Islam" },
                    { name: "Judaism" }
                ]
            },
            {
                name: "Romance",
                subcategories: [
                    { name: "Clean & Wholesome" },
                    { name: "Contemporary" },
                    { name: "Fantasy" },
                    { name: "Historical" },
                    { name: "LGBTQ+" },
                    { name: "Paranormal" },
                    { name: "Romantic Comedy" }
                ]
            },
            {
                name: "Science Fiction & Fantasy",
                subcategories: [
                    { name: "Cyberpunk" },
                    { name: "Dystopian" },
                    { name: "Epic" },
                    { name: "Fantasy" },
                    { name: "Science Fiction" },
                    { name: "Steampunk" }
                ]
            },
            { name: "Social Issues" },
            { name: "Sports & Outdoors" },
            { name: "Technology" }
        ]
    },
    {
        name: "Travel",
        subcategories: [
            { name: "Africa" },
            { name: "Asia" },
            { name: "Australia & South Pacific" },
            { name: "Canada" },
            { name: "Caribbean" },
            { name: "Central & South America" },
            { name: "Europe" },
            { name: "Food, Lodging & Transportation" },
            { name: "Guidebooks" },
            { name: "Middle East" },
            { name: "Pictorial" },
            { name: "Specialty Travel" },
            { name: "Travel Writing" },
            { name: "United States" }
        ]
    }
];
