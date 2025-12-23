import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

// HTTP Link
const httpLink = createHttpLink({
  uri: '/api/graphql',
});

// Auth Link
const authLink = setContext((_, { headers }) => {
  // Get the authentication token from session storage if it exists
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : null;
  
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  };
});

// Error Link
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
    
    // Handle authentication errors
    if ('statusCode' in networkError && networkError.statusCode === 401) {
      // Clear token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
  }
});

// Apollo Client
export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          inventoryItems: {
            merge(existing = [], incoming) {
              console.log('🔄 Apollo cache merge - existing:', existing?.length, 'incoming:', incoming?.length);
              return incoming; // Always use fresh data
            },
          },
          getInventoryItems: {
            merge(existing = [], incoming) {
              console.log('🔄 Apollo cache merge - existing:', existing?.length, 'incoming:', incoming?.length);
              return incoming;
            },
          },
          getTeamMembers: {
            merge(_, incoming) {
              return incoming;
            },
          },
          getLowStockItems: {
            merge(_, incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});