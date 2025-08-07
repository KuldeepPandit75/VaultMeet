export interface TestCase {
  input: string;
  expectedOutput: string;
  explanation?: string;
}

export interface DSAQuestion {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  description: string;
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  constraints: string[];
  testCases: TestCase[];
  starterCode: {
    javascript: string;
    python: string;
    java: string;
    cpp: string;
  };
  timeLimit: number; // in minutes
}

export const dsaQuestions: DSAQuestion[] = [
    
  {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    category: "Array, Hash Table",
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
      },
      {
        input: "nums = [3,2,4], target = 6",
        output: "[1,2]"
      },
      {
        input: "nums = [3,3], target = 6",
        output: "[0,1]"
      }
    ],
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists."
    ],
    testCases: [
      {
        input: "[2,7,11,15]\n9",
        expectedOutput: "[0,1]"
      },
      {
        input: "[3,2,4]\n6",
        expectedOutput: "[1,2]"
      },
      {
        input: "[3,3]\n6",
        expectedOutput: "[0,1]"
      },
      {
        input: "[1,5,3,7,9]\n12",
        expectedOutput: "[1,3]"
      }
    ],
    starterCode: {
      javascript: `function twoSum(nums, target) {
    // Your code here
    
}`,
      python: `def two_sum(nums, target):
    # Your code here
    pass`,
      java: `public int[] twoSum(int[] nums, int target) {
    // Your code here
    
}`,
      cpp: `vector<int> twoSum(vector<int>& nums, int target) {
    // Your code here
    
}`
    },
    timeLimit: 15
  },
//   {
//     id: "reverse-linked-list",
//     title: "Reverse Linked List",
//     difficulty: "Easy",
//     category: "Linked List",
//     description: `Given the head of a singly linked list, reverse the list, and return the reversed list.`,
//     examples: [
//       {
//         input: "head = [1,2,3,4,5]",
//         output: "[5,4,3,2,1]"
//       },
//       {
//         input: "head = [1,2]",
//         output: "[2,1]"
//       },
//       {
//         input: "head = []",
//         output: "[]"
//       }
//     ],
//     constraints: [
//       "The number of nodes in the list is the range [0, 5000].",
//       "-5000 <= Node.val <= 5000"
//     ],
//     testCases: [
//       {
//         input: "[1,2,3,4,5]",
//         expectedOutput: "[5,4,3,2,1]"
//       },
//       {
//         input: "[1,2]",
//         expectedOutput: "[2,1]"
//       },
//       {
//         input: "[]",
//         expectedOutput: "[]"
//       }
//     ],
//     starterCode: {
//       javascript: `function reverseList(head) {
//     // Your code here
    
// }`,
//       python: `def reverse_list(head):
//     # Your code here
//     pass`,
//       java: `public ListNode reverseList(ListNode head) {
//     // Your code here
    
// }`,
//       cpp: `ListNode* reverseList(ListNode* head) {
//     // Your code here
    
// }`
//     },
//     timeLimit: 12
//   },
//   {
//     id: "valid-parentheses",
//     title: "Valid Parentheses",
//     difficulty: "Easy",
//     category: "String, Stack",
//     description: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

// An input string is valid if:
// 1. Open brackets must be closed by the same type of brackets.
// 2. Open brackets must be closed in the correct order.
// 3. Every close bracket has a corresponding open bracket of the same type.`,
//     examples: [
//       {
//         input: 's = "()"',
//         output: "true"
//       },
//       {
//         input: 's = "()[]{}"',
//         output: "true"
//       },
//       {
//         input: 's = "(]"',
//         output: "false"
//       }
//     ],
//     constraints: [
//       "1 <= s.length <= 10^4",
//       "s consists of parentheses only '()[]{}'."
//     ],
//     testCases: [
//       {
//         input: '"()"',
//         expectedOutput: "true"
//       },
//       {
//         input: '"()[]{}"',
//         expectedOutput: "true"
//       },
//       {
//         input: '"(]"',
//         expectedOutput: "false"
//       },
//       {
//         input: '"([)]"',
//         expectedOutput: "false"
//       },
//       {
//         input: '"{[]}"',
//         expectedOutput: "true"
//       }
//     ],
//     starterCode: {
//       javascript: `function isValid(s) {
//     // Your code here
    
// }`,
//       python: `def is_valid(s):
//     # Your code here
//     pass`,
//       java: `public boolean isValid(String s) {
//     // Your code here
    
// }`,
//       cpp: `bool isValid(string s) {
//     // Your code here
    
// }`
//     },
//     timeLimit: 10
//   },
//   {
//     id: "longest-substring-without-repeating",
//     title: "Longest Substring Without Repeating Characters",
//     difficulty: "Medium",
//     category: "Hash Table, String, Sliding Window",
//     description: `Given a string s, find the length of the longest substring without repeating characters.`,
//     examples: [
//       {
//         input: 's = "abcabcbb"',
//         output: "3",
//         explanation: 'The answer is "abc", with the length of 3.'
//       },
//       {
//         input: 's = "bbbbb"',
//         output: "1",
//         explanation: 'The answer is "b", with the length of 1.'
//       },
//       {
//         input: 's = "pwwkew"',
//         output: "3",
//         explanation: 'The answer is "wke", with the length of 3.'
//       }
//     ],
//     constraints: [
//       "0 <= s.length <= 5 * 10^4",
//       "s consists of English letters, digits, symbols and spaces."
//     ],
//     testCases: [
//       {
//         input: '"abcabcbb"',
//         expectedOutput: "3"
//       },
//       {
//         input: '"bbbbb"',
//         expectedOutput: "1"
//       },
//       {
//         input: '"pwwkew"',
//         expectedOutput: "3"
//       },
//       {
//         input: '""',
//         expectedOutput: "0"
//       },
//       {
//         input: '"dvdf"',
//         expectedOutput: "3"
//       }
//     ],
//     starterCode: {
//       javascript: `function lengthOfLongestSubstring(s) {
//     // Your code here
    
// }`,
//       python: `def length_of_longest_substring(s):
//     # Your code here
//     pass`,
//       java: `public int lengthOfLongestSubstring(String s) {
//     // Your code here
    
// }`,
//       cpp: `int lengthOfLongestSubstring(string s) {
//     // Your code here
    
// }`
//     },
//     timeLimit: 20
//   },
//   {
//     id: "binary-tree-inorder-traversal",
//     title: "Binary Tree Inorder Traversal",
//     difficulty: "Easy",
//     category: "Stack, Tree, Depth-First Search",
//     description: `Given the root of a binary tree, return the inorder traversal of its nodes' values.`,
//     examples: [
//       {
//         input: "root = [1,null,2,3]",
//         output: "[1,3,2]"
//       },
//       {
//         input: "root = []",
//         output: "[]"
//       },
//       {
//         input: "root = [1]",
//         output: "[1]"
//       }
//     ],
//     constraints: [
//       "The number of nodes in the tree is in the range [0, 100].",
//       "-100 <= Node.val <= 100"
//     ],
//     testCases: [
//       {
//         input: "[1,null,2,3]",
//         expectedOutput: "[1,3,2]"
//       },
//       {
//         input: "[]",
//         expectedOutput: "[]"
//       },
//       {
//         input: "[1]",
//         expectedOutput: "[1]"
//       }
//     ],
//     starterCode: {
//       javascript: `function inorderTraversal(root) {
//     // Your code here
    
// }`,
//       python: `def inorder_traversal(root):
//     # Your code here
//     pass`,
//       java: `public List<Integer> inorderTraversal(TreeNode root) {
//     // Your code here
    
// }`,
//       cpp: `vector<int> inorderTraversal(TreeNode* root) {
//     // Your code here
    
// }`
//     },
//     timeLimit: 15
//   },
//   {
//     id: "median-of-two-sorted-arrays",
//     title: "Median of Two Sorted Arrays",
//     difficulty: "Hard",
//     category: "Array, Binary Search, Divide and Conquer",
//     description: `Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.

// The overall run time complexity should be O(log (m+n)).`,
//     examples: [
//       {
//         input: "nums1 = [1,3], nums2 = [2]",
//         output: "2",
//         explanation: "merged array = [1,2,3] and median is 2."
//       },
//       {
//         input: "nums1 = [1,2], nums2 = [3,4]",
//         output: "2.5",
//         explanation: "merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5."
//       }
//     ],
//     constraints: [
//       "nums1.length == m",
//       "nums2.length == n",
//       "0 <= m <= 1000",
//       "0 <= n <= 1000",
//       "1 <= m + n <= 2000",
//       "-10^6 <= nums1[i], nums2[i] <= 10^6"
//     ],
//     testCases: [
//       {
//         input: "[1,3]\n[2]",
//         expectedOutput: "2"
//       },
//       {
//         input: "[1,2]\n[3,4]",
//         expectedOutput: "2.5"
//       },
//       {
//         input: "[0,0]\n[0,0]",
//         expectedOutput: "0"
//       },
//       {
//         input: "[]\n[1]",
//         expectedOutput: "1 "
//       }
//     ],
//     starterCode: {
//       javascript: `function findMedianSortedArrays(nums1, nums2) {
//     // Your code here
    
// }`,
//       python: `def find_median_sorted_arrays(nums1, nums2):
//     # Your code here
//     pass`,
//       java: `public double findMedianSortedArrays(int[] nums1, int[] nums2) {
//     // Your code here
    
// }`,
//       cpp: `double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {
//     // Your code here
    
// }`
//     },
//     timeLimit: 30
//   }
];

export const getQuestionsByDifficulty = (difficulty: 'Easy' | 'Medium' | 'Hard'): DSAQuestion[] => {
  return dsaQuestions.filter(q => q.difficulty === difficulty);
};

export const getQuestionById = (id: string): DSAQuestion | undefined => {
  return dsaQuestions.find(q => q.id === id);
};

export const getRandomQuestion = (difficulty?: 'Easy' | 'Medium' | 'Hard'): DSAQuestion => {
  const questions = difficulty ? getQuestionsByDifficulty(difficulty) : dsaQuestions;
  return questions[Math.floor(Math.random() * questions.length)];
}; 