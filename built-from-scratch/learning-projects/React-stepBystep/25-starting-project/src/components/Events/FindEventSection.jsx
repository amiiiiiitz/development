import { useQuery } from '@tanstack/react-query';
import { use, useState } from 'react';
import { useRef } from 'react';
import { fetchEvents } from '../../util/http.js';
import LoadingIndicator from '../UI/LoadingIndicator.jsx';
import ErrorBlock from '../UI/ErrorBlock.jsx';
import EventItem from './EventItem';

export default function FindEventSection() {
  const searchElement = useRef();

  const [ searchTerm, setSearchTerm ] = useState();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['events', { searchTerm: searchTerm }],
    queryFn: ({ signal, queryKey }) => fetchEvents({ signal, ...queryKey[1] }),
    enabled: searchTerm !== undefined, // this will prevent the query from running automatically when the component mounts, and it will only run when the searchTerm state is updated by the user submitting the search form. this is useful to prevent fetching all events when the component mounts, and it will only fetch events when the user submits a search term.
  });

  function handleSubmit(event) {
    event.preventDefault();
    setSearchTerm(searchElement.current.value);
  }

  let content = <p>Please enter a search term and to find events.</p>;

  if (isLoading) {
    // diff of isPending and isLoading: isPending is true when the query is in the process of fetching data, and it will be true for the entire duration of the fetch, including the time when the data is being processed and stored in the cache. isLoading is true only during the initial fetch, and it will be false after the data has been fetched and stored in the cache, even if the data is still being processed. so if we want to show a loading indicator while the data is being fetched and processed, we should use isPending instead of isLoading. but in this case, we want to show the loading indicator only during the initial fetch, so we can use isLoading. if we want to show the loading indicator while the data is being fetched and processed, we should use isPending. but in this case, we want to show the loading indicator only during the initial fetch, so we can use isLoading.
    content = <LoadingIndicator />;
  }
  if (isError) {
    content = <ErrorBlock title="An error occurred" message={error.info?.message || 'Failed to fetch events.'} />;
  }

  if (data) {
    content = (
      <ul className="events-list">
        {data.map((event) => (
          <li key={event.id}><EventItem event={event} /></li>
        ))}
      </ul>
    );
  }
  return (
    <section className="content-section" id="all-events-section">
      <header>
        <h2>Find your next event!</h2>
        <form onSubmit={handleSubmit} id="search-form">
          <input
            type="search"
            placeholder="Search events"
            ref={searchElement}
          />
          <button>Search</button>
        </form>
      </header>
      { content }
    </section>
  );
}
